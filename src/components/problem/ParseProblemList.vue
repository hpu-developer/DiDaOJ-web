<script lang="tsx" setup>
import { ref, watch } from "vue";
import { ShowErrorTips, SplitIdStringsFromText, useCurrentInstance } from "@/util";
import { PostProblemParse, PostProblemParseId } from "@/apis/problem.ts";
import { ParseValidType } from "@/util/parse.ts";
import type { Problem, ProblemView } from "@/types/problem.ts";

const { globalProperties } = useCurrentInstance();

defineOptions({ name: "ParseProblemList" });

const showDialog = ref(false);
const isParsing = ref(false);
const textareaValue = ref("");

const modelProblemIds = defineModel<number[]>();
let filteredProblemIds = [] as number[];

const localViews = ref<ProblemView[]>([]);

const listColumns = ref([
  {
    title: "有效性",
    colKey: "validType",
    cell: (_: any, data: any) => {
      switch (data.row.valid) {
        case ParseValidType.Valid:
          return <t-tag theme="success">有效</t-tag>;
        case ParseValidType.Duplicate:
          return <t-tag theme="warning">重复</t-tag>;
        case ParseValidType.Invalid:
          return <t-tag theme="danger">无效</t-tag>;
        default:
          return null;
      }
    },
  },
  {
    title: "问题标识",
    colKey: "key",
    cell: (_: any, data: any) => {
      const url = `/problem/${data.row.key}`;
      return (
        <t-link href={url} target="_blank">
          {data.row.key}
        </t-link>
      );
    },
  },
  {
    title: "标题",
    colKey: "title",
  },
]);

const loadProblemListById = async (problemIds: number[]) => {
  const uniqueIds = Array.from(new Set(problemIds));
  const res = await PostProblemParseId(uniqueIds.map((id) => id));

  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    isParsing.value = false;
    return;
  }

  const results: ProblemView[] = [];
  const fetched = res.data.problems as Problem[];

  let finalProblemIds = [] as number[];
  problemIds.forEach((id) => {
    const matched = fetched.find((p) => p.id === id);
    if (matched) {
      const alreadyExists = results.find((p) => p.id === id);
      matched.valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
      results.push({ id: matched.id, key: matched.key, title: matched.title, valid: matched.valid });
      if (!alreadyExists) {
        finalProblemIds.push(id);
      }
    } else {
      results.push({ id: 0, key: "-", title: "-", valid: ParseValidType.Invalid });
    }
  });

  localViews.value = results;
  filteredProblemIds = finalProblemIds;
  modelProblemIds.value = finalProblemIds;
};

const loadProblemListByKey = async (problemKeys: string[]) => {
  const uniqueIds = Array.from(new Set(problemKeys));
  const res = await PostProblemParse(uniqueIds);

  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    isParsing.value = false;
    return;
  }

  const results: ProblemView[] = [];
  const fetched = res.data.problems as Problem[];

  let finalProblemIds = [] as number[];
  problemKeys.forEach((key) => {
    const matched = fetched.find((p) => p.key.toLowerCase() === key.toLowerCase());
    if (matched) {
      const alreadyExists = results.find((p) => p.key.toLowerCase() === key.toLowerCase());
      matched.valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
      results.push({ id: matched.id, key: matched.key, title: matched.title, valid: matched.valid });
      if (!alreadyExists) {
        finalProblemIds.push(matched.id);
      }
    } else {
      results.push({ id: 0, key: key, title: "-", valid: ParseValidType.Invalid });
    }
  });

  localViews.value = results;
  filteredProblemIds = finalProblemIds;
  modelProblemIds.value = finalProblemIds;
};

const handleParse = async () => {
  isParsing.value = true;

  const inputIds = SplitIdStringsFromText(textareaValue.value);

  await loadProblemListByKey(inputIds);

  showDialog.value = false;
  isParsing.value = false;
};

const handleParseProblem = () => {
  if (localViews.value) {
    textareaValue.value = localViews.value.map((v) => v.id).join("\n");
  } else {
    textareaValue.value = "";
  }
  showDialog.value = true;
};

watch(
  modelProblemIds,
  async (newVal) => {
    if (JSON.stringify(newVal) === JSON.stringify(filteredProblemIds)) {
      return;
    }
    if (!newVal) {
      filteredProblemIds = [];
      return;
    }
    await loadProblemListById(newVal);
    if (modelProblemIds.value) {
      filteredProblemIds = modelProblemIds.value;
    } else {
      filteredProblemIds = [];
    }
  },
  {
    deep: true,
    immediate: true,
  }
);
</script>

<template>
  <div class="dida-form-border">
    <div style="text-align: right">
      <t-button @click="handleParseProblem">编辑</t-button>
    </div>
    <t-table :data="localViews" :columns="listColumns" row-key="id" vertical-align="top" table-layout="auto" :hover="true" />
  </div>

  <t-dialog v-model:visible="showDialog" @confirm="handleParse" header="请输入问题标识" :confirm-loading="isParsing">
    <div style="margin-bottom: 10px">
      <span>多条请以空格、换行、英文逗号隔开</span>
    </div>
    <t-textarea v-model="textareaValue" :autosize="{ minRows: 5 }" />
  </t-dialog>
</template>

<style scoped>
.dida-form-border {
  border: rgba(75, 75, 75, 0.3) 1px solid;
  padding: 10px;
  border-radius: 5px;
  min-width: 100%;
}
</style>
