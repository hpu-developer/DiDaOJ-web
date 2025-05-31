<script setup lang="tsx">
import { ref, onMounted, nextTick, computed } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetCollection, ParseCollection } from "@/apis/collection.ts";
import { ShowErrorTips, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { CollectionView } from "@/types/collection.ts";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { ProblemView } from "@/types/problem.ts";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let collectionId = 0;
const collectionLoading = ref(false);
const collectionData = ref<CollectionView | null>(null);

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageCollection) || (collectionData.value && userStore.getUserId == collectionData.value.ownerId);
});

const listColumns = ref([
  {
    title: "问题ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoCollectionProblem(data.row.id)}>
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
        <t-button variant="text" onClick={() => handleGotoCollectionProblem(data.row.id)}>
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

const handleGotoCollectionProblem = (problemId: string) => {
  router.push({
    name: "problem-detail",
    params: { problemId: problemId },
  });
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
    await router.push({ name: "collection" });
    return;
  }

  collectionLoading.value = true;

  const res = await GetCollection(collectionId);
  if (res.code !== 0) {
    collectionLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "collection" });
    return;
  }

  collectionData.value = await ParseCollection(res.data.collection);
  problemViews.value = res.data.problems;
  problemViews.value.sort((a, b) => {
    if (a.id.length == b.id.length) {
      return a.id.localeCompare(b.id);
    }
    return a.id.length - b.id.length;
  });

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
          <h1>{{ collectionData?.title }}</h1>
          <t-alert v-if="collectionData?.notification" theme="info" :message="collectionData?.notification" />
        </div>
        <t-card style="margin: 10px">
          <t-table :data="problemViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" />
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
            <t-descriptions-item label="开始时间">{{ collectionData?.startTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="结束时间">{{ collectionData?.endTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <t-card style="margin: 10px">
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
