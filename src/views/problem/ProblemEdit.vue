<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { ChevronDownIcon } from "tdesign-icons-vue-next";
import Vditor from "vditor";
import { GetProblem, GetProblemTagList, ParseProblem, PostProblemEdit } from "@/apis/problem.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { ProblemTag, ProblemView } from "@/types/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const problemId = ref("");
const problemLoading = ref(false);
let descriptionEditor = null as Vditor | null;
const isEditing = ref(false);

const problemData = ref<ProblemView | null>(null);

const problemEditForm = ref({
  title: "",
  timeLimit: 0,
  memoryLimit: 0,
  source: "",
  tags: [] as string[],
});

const problemTags = ref([] as { label: string; value: number }[]);
const problemTagOptions = ref([] as { label: string; value: number }[]);

const problemTagsCheckbox = computed(() => {
  const arr = [];
  const list = problemTags.value;
  // 此处不使用 forEach，减少函数迭代
  for (let i = 0, len = list.length; i < len; i++) {
    list[i].value && arr.push(list[i].value);
  }
  return arr;
});

const onTagChange = (_: any, context: any) => {
  const { trigger, index, item } = context;
  if (trigger === "clear") {
    problemTags.value = [];
  }
  if (["tag-remove", "backspace"].includes(trigger)) {
    problemTags.value.splice(index, 1);
  }
  if (trigger === "enter") {
    for (let i = 0; i < problemTagOptions.value.length; i++) {
      const tag = problemTagOptions.value[i];
      if (tag.label === item) {
        for (let j = 0; j < problemTags.value.length; j++) {
          if (problemTags.value[j].label === tag.label) {
            return;
          }
        }
        problemTags.value.push(tag);
        return;
      }
    }
    const current = { label: item, value: item };
    problemTags.value.push(current);
    problemTagOptions.value = problemTagOptions.value.concat(current);
  }
};

const onTagCheckedChange = (_: any, { current, type }: any) => {
  // current 不存在，则表示操作全选
  if (!current) {
    problemTags.value = type === "check" ? problemTagOptions.value.slice(1) : [];
    return;
  }
  // 普通操作
  if (type === "check") {
    const option = problemTagOptions.value.find((t) => t.value === current);
    if (!option) {
      return;
    }
    problemTags.value.push(option);
  } else {
    problemTags.value = problemTags.value.filter((v) => v.value !== current);
  }
};

const handleClickView = () => {
  router.push({
    name: "problem-detail",
    params: {
      problemId: problemId.value,
    },
  });
};

const handleClickJudge = () => {
  router.push({
    name: "manage-problem-judge",
    params: {
      problemId: problemId.value,
    },
  });
};

const handleClickSave = async () => {
  if (!descriptionEditor) {
    return;
  }

  isEditing.value = true;

  problemEditForm.value.tags = [];
  for (let i = 0; i < problemTags.value.length; i++) {
    const tag = problemTags.value[i];
    if (tag && tag.label) {
      problemEditForm.value.tags.push(tag.label);
    }
  }

  try {
    const res = await PostProblemEdit(
      problemId.value,
      problemEditForm.value.title,
      problemEditForm.value.timeLimit,
      problemEditForm.value.memoryLimit,
      problemEditForm.value.source,
      problemEditForm.value.tags,
      descriptionEditor.getValue()
    );

    isEditing.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      problemData.value.updateTime = new Date(res.data).toLocaleString();
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isEditing.value = false;
  }
};

const loadProblem = async () => {
  const res = await GetProblem(problemId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("problem get failed", res.code);
    await router.push({ name: "problem" });
    return;
  }

  const problem = res.data.problem;

  problemData.value = ParseProblem(problem, {} as any);

  problemEditForm.value.title = problem.title;
  problemEditForm.value.timeLimit = problem.time_limit;
  problemEditForm.value.memoryLimit = problem.memory_limit;
  problemEditForm.value.source = problem.source;

  problemEditForm.value.tags = [];
  problemTags.value = [] as { label: string; value: number }[];
  if (res.data.tags) {
    for (let i = 0; i < res.data.tags.length; i++) {
      const tag = res.data.tags[i];
      if (tag && tag.name) {
        problemEditForm.value.tags.push(tag.name);
        problemTags.value.push({ label: tag.name, value: tag.id });
      }
    }
  }

  webStyleStore.setTitle(problem.title + " - " + webStyleStore.getTitle);

  let problemDescription = problem.description as string;

  const codeEditOptions = {
    after: () => {
      descriptionEditor?.setValue(problemDescription);
    },
  } as IOptions;
  descriptionEditor = new Vditor("codeEditRef", codeEditOptions);

  problemLoading.value = false;
};

onMounted(async () => {
  if (Array.isArray(route.params.problemId)) {
    problemId.value = route.params.problemId[0];
  } else {
    problemId.value = route.params.problemId;
  }
  if (!problemId.value) {
    ShowTextTipsError(globalProperties, "题目不存在");
    await router.push({ name: "problem" });
    return;
  }

  problemLoading.value = true;

  GetProblemTagList(-1)
    .then(async (res) => {
      if (res.code === 0) {
        if (res.data.list) {
          res.data.list.forEach((tag: ProblemTag) => {
            problemTagOptions.value.push({
              label: tag.name,
              value: tag.id,
            });
          });
        }
        await loadProblem();
      } else {
        ShowErrorTips(globalProperties, res.code);
        console.error("problem tag get failed", res.code);
        await router.push({ name: "problem" });
      }
    })
    .catch(async (err) => {
      console.error(err);
      ShowErrorTips(globalProperties, "获取数据异常");
      await router.push({ name: "problem" });
    });
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-card">
            <t-form :model="problemEditForm">
              <t-form-item label="标题">
                <t-input v-model="problemEditForm.title" placeholder="问题标题"></t-input>
              </t-form-item>
              <t-form-item label="时间限制">
                <t-input-number v-model="problemEditForm.timeLimit" theme="normal" :min="0">
                  <template #suffix><span>ms</span></template>
                </t-input-number>
              </t-form-item>
              <t-form-item label="内存限制">
                <t-input-number v-model="problemEditForm.memoryLimit" theme="normal" :min="0">
                  <template #suffix><span>KB</span></template>
                </t-input-number>
              </t-form-item>
              <t-form-item label="来源">
                <t-input v-model="problemEditForm.source" placeholder="请输入题目来源"></t-input>
              </t-form-item>

              <t-form-item label="标签">
                <t-select-input
                  :value="problemTags"
                  :allow-input="true"
                  placeholder="请选择或输入"
                  :tag-input-props="{ excessTagsDisplayType: 'break-line' }"
                  :popup-props="{
                    overlayInnerClassName: ['narrow-scrollbar'],
                    overlayInnerStyle: {
                      maxHeight: '280px',
                      overflowY: 'auto',
                      overscrollBehavior: 'contain',
                      padding: '6px',
                    },
                  }"
                  clearable
                  multiple
                  @tag-change="onTagChange"
                >
                  <template #panel>
                    <t-checkbox-group
                      v-if="problemTagOptions.length"
                      :value="problemTagsCheckbox"
                      :options="problemTagOptions"
                      @change="onTagCheckedChange"
                    />
                    <div v-else>暂无数据</div>
                  </template>
                  <template #suffixIcon>
                    <ChevronDownIcon />
                  </template>
                </t-select-input>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space>
              <t-button @click="handleClickSave" theme="danger" :loading="isEditing">保存</t-button>
              <t-button @click="handleClickJudge" theme="warning">判题数据</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ problemData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="判题方式">{{ problemData?.judgeType }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{ problemData?.creatorNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div id="codeEditRef" class="dida-description-editor"></div>
  </t-loading>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-description-editor {
  margin: 20px;
  width: 100%;
  max-width: calc(100vw - 300px);
  min-height: 500px;
  z-index: 9999 !important;
}
</style>
