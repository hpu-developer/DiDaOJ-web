<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { ChevronDownIcon } from "tdesign-icons-vue-next";
import Vditor from "vditor";
import { GetProblem, GetProblemJudge, GetProblemTagList, ParseProblem, PostProblemEdit } from "@/apis/problem.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { ProblemTag, ProblemView } from "@/types/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const problemId = ref("");
const problemLoading = ref(false);
let descriptionEditor = null as Vditor | null;

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

const handleClickView = () => {
  router.push({
    name: "problem-detail",
    params: {
      problemId: problemId.value,
    },
  });
};

const handleClickEdit = () => {
  router.push({
    name: "manage-problem",
    params: {
      problemId: problemId.value,
    },
  });
};

const handleClickSave = async () => {
  if (!descriptionEditor) {
    return;
  }

  problemEditForm.value.tags = [];
  for (let i = 0; i < problemTags.value.length; i++) {
    const tag = problemTags.value[i];
    if (tag && tag.label) {
      problemEditForm.value.tags.push(tag.label);
    }
  }

  const res = await PostProblemEdit(
    problemId.value,
    problemEditForm.value.title,
    problemEditForm.value.timeLimit,
    problemEditForm.value.memoryLimit,
    problemEditForm.value.source,
    problemEditForm.value.tags,
    descriptionEditor.getValue()
  );
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }

  ShowTextTipsSuccess(globalProperties, "保存成功");
};

const loadProblem = async () => {
  const res = await GetProblemJudge(problemId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
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

  problemLoading.value = false;
};

onMounted(async () => {
  if (route.params.problemId && route.params.problemId.length === 1) {
    problemId.value = route.params.problemId[0];
  } else {
    await router.push({ name: "problem" });
    return;
  }

  problemLoading.value = true;

  await loadProblem();
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-card">
            列表
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space>
              <t-button @click="handleClickSave" theme="danger">保存</t-button>
              <t-button @click="handleClickEdit" theme="warning">编辑</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="标题">{{ problemData?.title }}</t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ problemData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{ problemData?.creatorNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}
</style>
