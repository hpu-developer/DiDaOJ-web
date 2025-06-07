<script setup lang="tsx">
import { ref, onMounted, nextTick, computed } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetCollection, ParseCollection, PostCollectionJoin, PostCollectionQuit } from "@/apis/collection.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { CollectionView } from "@/types/collection.ts";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { Problem, ProblemView } from "@/types/problem.ts";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";
import { ProblemAttemptStatus } from "@/apis/problem.ts";
import { handleGotoContestProblem, handleGotoProblem } from "@/util/router.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let collectionId = 0;
const collectionLoading = ref(false);
const collectionData = ref<CollectionView | null>(null);
const joined = ref(false);
const joinLoading = ref(false);
let problemAttemptStatus = {} as { [key: string]: ProblemAttemptStatus };

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageCollection) || (collectionData.value && userStore.getUserId == collectionData.value.ownerId);
});

const getProblemIdTheme = (id: string) => {
  if (!id) {
    return "default";
  }
  if (!problemAttemptStatus) {
    return "default";
  }
  const status = problemAttemptStatus[id];
  if (!status) {
    return "default";
  }
  switch (status) {
    case ProblemAttemptStatus.Accept:
      return "success";
    case ProblemAttemptStatus.Attempt:
      return "warning";
    default:
      return "default";
  }
};

const listColumns = ref([
  {
    title: "问题ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      const theme = getProblemIdTheme(data.row.id);
      return (
        <t-button variant="dashed" theme={theme} onClick={async () => await handleGotoProblem(data.row.id)}>
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
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.id)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "正确",
    colKey: "accept",
    cell: (_: any, data: any) => {
      return data.row.accept ? data.row.accept : 0;
    },
  },
  {
    title: "提交",
    colKey: "attempt",
    cell: (_: any, data: any) => {
      return data.row.attempt ? data.row.attempt : 0;
    },
  },
]);

const problemViews = ref<ProblemView[]>([]);

const handleClickJoin = async () => {
  if (!userStore.isLogin()) {
    await router.push({ name: "login" });
    return;
  }

  joinLoading.value = true;
  try {
    const res = await PostCollectionJoin(collectionId);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    joined.value = true;
    ShowTextTipsSuccess(globalProperties, "加入成功");
  } finally {
    joinLoading.value = false;
  }
};

const handleClickQuit = async () => {
  if (!userStore.isLogin()) {
    await router.push({ name: "login" });
    return;
  }

  joinLoading.value = true;
  try {
    const res = await PostCollectionQuit(collectionId);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    joined.value = false;
    ShowTextTipsSuccess(globalProperties, "退出成功");
  } finally {
    joinLoading.value = false;
  }
};

const handleClickEdit = () => {
  if (!collectionData.value) {
    return;
  }
  router.push({
    name: "collection-edit",
    params: { collectionId: collectionData.value.id },
  });
};

onMounted(async () => {
  if (Array.isArray(route.params.collectionId)) {
    collectionId = Number(route.params.collectionId[0]);
  } else {
    collectionId = Number(route.params.collectionId);
  }
  if (!collectionId) {
    await router.push({ name: "problem-collection-list" });
    return;
  }
  joined.value = false;
  collectionLoading.value = true;

  const res = await GetCollection(collectionId);
  if (res.code !== 0) {
    collectionLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem-collection-list" });
    return;
  }

  joined.value = res.data.joined;
  problemAttemptStatus = res.data.attempt_status || {};
  collectionData.value = await ParseCollection(res.data.collection);
  problemViews.value = [];
  if (res.data.collection.problems) {
    res.data.collection.problems.forEach((problemId: string) => {
      const problem = res.data.problems.find((p: Problem) => p.id === problemId);
      problemViews.value.push(problem);
    });
  }

  webStyleStore.setTitle(collectionData.value.title + " - " + webStyleStore.getTitle);

  await nextTick(() => {
    const collectionDescriptions = document.querySelectorAll(".dida-content-description");
    if (collectionDescriptions && collectionDescriptions.length > 0) {
      collectionDescriptions.forEach((description: any) => {
        Vditor.mathRender(description);
        Vditor.highlightRender({ lineNumber: true, enable: true }, description);
        enhanceCodeCopy(description);
      });
    }
    collectionLoading.value = false;
  });
});
</script>

<template>
  <t-loading :loading="collectionLoading">
    <t-row class="dida-main-content">
      <t-col :span="6">
        <div style="margin: 20px">
          <t-breadcrumb max-item-width="300">
            <t-breadcrumb-item :to="{ name: 'problem-collection-list' }">题目集合</t-breadcrumb-item>
            <t-breadcrumb-item>{{ collectionData?.title }}</t-breadcrumb-item>
          </t-breadcrumb>
        </div>
        <t-card style="margin: 10px">
          <t-table :data="problemViews" :columns="listColumns" row-key="id" vertical-align="top" table-layout="auto" :hover="true" />
        </t-card>
      </t-col>
      <t-col :span="6">
        <div class="dida-operation-container">
          <t-space>
            <t-button v-if="joined" @click="handleClickQuit" :loading="joinLoading">退出</t-button>
            <t-button v-else @click="handleClickJoin" :loading="joinLoading">加入</t-button>
            <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
          </t-space>
        </div>

        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="创建者">{{ collectionData?.ownerNickname }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="开始时间">{{ collectionData?.startTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="结束时间">{{ collectionData?.endTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <t-card style="margin: 10px" v-if="collectionData?.description">
          <div v-html="collectionData?.description" class="dida-content-description"></div>
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
