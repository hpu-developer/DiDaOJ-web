<script lang="tsx" setup>
import { ref, watch } from "vue";
import { ShowErrorTips, SplitIdStringsFromText } from "@/util";
import { PostProblemParse } from "@/apis/problem.ts";
import { ParseValidType } from "@/util/parse.ts";

defineOptions({ name: "ParseProblemList" });

const showDialog = ref(false);
const isParsing = ref(false);
const textareaValue = ref("");

const emit = defineEmits<{
  (e: "change", value: number[]): void;
}>();

const localViews = defineModel<Problem[]>();

watch(localViews, (newVal) => {
  emit("change", newVal.map((p) => p.id));
}, { deep: true });

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
    title: "问题ID",
    colKey: "id",
  },
  {
    title: "标题",
    colKey: "title",
  },
]);

const handleParse = async () => {
  isParsing.value = true;

  const inputIds = SplitIdStringsFromText(textareaValue.value);
  const uniqueIds = Array.from(new Set(inputIds));
  const res = await PostProblemParse(uniqueIds);

  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    isParsing.value = false;
    return;
  }

  const results: Problem[] = [];
  const fetched = res.data.problems as Problem[];

  inputIds.forEach((id) => {
    const matched = fetched.find((p) => p.id === id);
    if (matched) {
      const alreadyExists = results.find((p) => p.id === id);
      matched.valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
      results.push({ id, title: matched.title, valid: matched.valid });
    } else {
      results.push({ id, title: "-", valid: ParseValidType.Invalid });
    }
  });

  localViews.value = results;

  showDialog.value = false;
  isParsing.value = false;
};

const handleParseProblem = () => {
  textareaValue.value = localViews.value.map((v) => v.id).join("\n");
  showDialog.value = true;
};
</script>

<template>
  <div class="dida-form-border">
    <div style="text-align: right">
      <t-button @click="handleParseProblem">编辑</t-button>
    </div>
    <t-table :data="localViews" :columns="listColumns" row-key="id" vertical-align="top" table-layout="auto" :hover="true" />
  </div>

  <t-dialog v-model:visible="showDialog" @confirm="handleParse" header="请输入问题ID" :confirm-loading="isParsing">
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
