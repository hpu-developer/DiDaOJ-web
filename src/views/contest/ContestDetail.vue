<script setup lang="tsx">
import { ref, onMounted, nextTick, computed } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetContest, ParseContest } from "@/apis/contest.ts";
import { ShowErrorTips, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import type { ContestView } from "@/types/contest.ts";
import type { ProblemView } from "@/types/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let contestId = 0;
const contestLoading = ref(false);
const contestData = ref<ContestView | null>(null);

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageContest) || (contestData.value && userStore.getUserId == contestData.value.ownerId);
});

const listColumns = ref([
  {
    title: "问题ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoContestProblem(contestId, data.row.index)}>
          {data.row.id}
        </t-button>
      );
    },
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoContestProblem(contestId, data.row.index)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "正确",
    colKey: "accept",
  },
  {
    title: "提交",
    colKey: "attempt",
  },
]);

const problemViews = ref<ProblemView[]>([]);

const handleGotoContestProblem = (contestId: number, problemIndex: string) => {
  router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: problemIndex } });
};

const handleClickEdit = () => {
  router.push({ name: "contest-edit", params: { contestId: contestId } });
};

onMounted(async () => {
  if (Array.isArray(route.params.contestId)) {
    contestId = Number(route.params.contestId[0]);
  } else {
    contestId = Number(route.params.contestId);
  }
  if (!contestId) {
    await router.push({ name: "contest" });
    return;
  }

  contestLoading.value = true;

  const res = await GetContest(contestId);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
    return;
  }

  contestData.value = await ParseContest(res.data);
  problemViews.value = contestData.value.problems;

  webStyleStore.setTitle(contestData.value.title + " - " + webStyleStore.getTitle);

  await nextTick(() => {
    const contestDescriptions = document.querySelectorAll(".dida-content-description");
    if (contestDescriptions && contestDescriptions.length > 0) {
      contestDescriptions.forEach((description: any) => {
        Vditor.mathRender(description);
        Vditor.highlightRender({ lineNumber: true, enable: true }, description);
        enhanceCodeCopy(description);
      });
    }
    contestLoading.value = false;
  });
});
</script>

<template>
  <t-loading :loading="contestLoading">
    <t-row class="dida-main-content">
      <t-col :span="6">
        <div style="margin: 20px">
          <h1>{{ contestData?.title }}</h1>
          <t-alert v-if="contestData?.notification" theme="info" :message="contestData?.notification" />
        </div>
        <t-card style="margin: 10px">
          <t-table :data="problemViews" :columns="listColumns" row-key="id" table-layout="auto" vertical-align="top" :hover="true" />
        </t-card>
      </t-col>
      <t-col :span="6">
        <div class="dida-operation-container">
          <t-space>
            <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
          </t-space>
        </div>
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="开始时间">{{ contestData?.startTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="结束时间">{{ contestData?.endTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <t-card style="margin: 12px" v-if="contestData?.description">
          <div v-html="contestData?.description" class="dida-content-description"></div>
        </t-card>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-operation-container {
  margin: 20px 12px 20px;
  text-align: right;
}
</style>
