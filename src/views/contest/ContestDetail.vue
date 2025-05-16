<script setup lang="tsx">
import { ref, onMounted, nextTick } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetContest, ParseContest } from "@/apis/contest.ts";
import { ShowErrorTips, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { ContestView } from "@/types/contest.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const contestId = ref("");
const contestLoading = ref(false);
const contestData = ref<ContestView | null>(null);

const listColumns = ref([
  {
    title: "ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return <t-button variant="text">{data.row.id}</t-button>;
    },
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return <t-button variant="text">{data.row.title}</t-button>;
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

const problemViews = ref([]);

onMounted(async () => {
  if (route.params.contestId && route.params.contestId.length === 1) {
    contestId.value = route.params.contestId[0];
  } else {
    await router.push({ name: "contest" });
    return;
  }

  contestLoading.value = true;

  const res = await GetContest(contestId.value);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
    return;
  }

  contestData.value = await ParseContest(res.data);
  problemViews.value = contestData.value.problems;

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
      <t-col :span="8">
        <h1>{{ contestData?.title }}</h1>
        <t-alert v-if="contestData?.notification" theme="info" :message="contestData?.notification" />
        <t-collapse :default-value="[0]" :expand-icon="false" :borderless="true">
          <t-collapse-panel v-for="(description, index) in contestData?.descriptions" :key="index" :header="description.title">
            <template #headerRightContent v-if="index === 0">
              <t-space size="small">
                <t-button size="small">收起全部</t-button>
                <t-button size="small">展开全部</t-button>
              </t-space>
            </template>
            <div v-html="description.content" class="dida-content-description"></div>
          </t-collapse-panel>
        </t-collapse>

        <t-card style="margin: 10px">
          <t-table :data="problemViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" />
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="开始时间">{{ contestData?.startTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
