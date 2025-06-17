<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetRankACAll, GetRankACProblem, GetRankACProblemToday, GetRankACProblemDay7, GetRankACProblemDay30, GetRankACProblemYear } from "@/apis/rank.ts";
import { UserRank } from "@/types/rank.ts";
import { JudgeStatus } from "@/apis/judge.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let watchHandle: WatchStopHandle | null = null;

const props = defineProps<{ type?: string }>();

const descriptionHeader = ref("");
const descriptionContent = ref("");

const descriptionConfig = {
  all: {
    header: "统计所有用户在本站的提交记录",
    content: "优先以AC记录数量排序，如果相同则提交所用次数较少的优先，如果仍相同，注册较早的用户靠前",
  },
  problem: {
    header: "统计所有用户在本站的提交记录",
    content: "以题目记录数量排序，如果相同，注册较早的用户靠前",
  },
  "problem-today": {
    header: "统计所有用户今日在本站的提交记录",
    content: "以今日题目记录数量排序，如果相同，注册较早的用户靠前",
  },
  "problem-day7": {
    header: "统计所有用户最近7日在本站的提交记录",
    content: "以7日题目记录数量排序（从7日前的0点开始计算），如果相同，注册较早的用户靠前",
  },
  "problem-day30": {
    header: "统计所有用户最近30日在本站的提交记录",
    content: "以30日题目记录数量排序（从30日前的0点开始计算），如果相同，注册较早的用户靠前",
  },
  "problem-year": {
    header: "统计所有用户最近1年在本站的提交记录",
    content: "以最近1年题目记录数量排序（从365日前的0点开始计算），如果相同，注册较早的用户靠前",
  },
};

const listColumns = ref([] as any);

const userColumns = [
  {
    title: "序号",
    colKey: "index",
  },
  {
    title: "用户名",
    colKey: "username",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="dashed" onClick={() => handleGotoUsername(data.row.username)}>
          {data.row.username}
        </t-button>
      );
    },
  },
  {
    title: "昵称",
    colKey: "nickname",
  },
  {
    title: "Slogan",
    colKey: "slogan",
  },
];

const problemColumns = [
  {
    title: "题目数量",
    colKey: "problem_count",
    cell: (_: any, data: any) => {
      let problemCount = 0;
      if (data.row.problem_count) {
        problemCount = data.row.problem_count;
      }
      return (
        <t-button variant="dashed" onClick={() => handleGotoJudgeAccept(data.row.username)}>
          {problemCount}
        </t-button>
      );
    },
  },
];

const acColumns = [
  {
    title: "正确",
    colKey: "accept",
    cell: (_: any, data: any) => {
      let acceptCount = 0;
      if (data.row.accept) {
        acceptCount = data.row.accept;
      }
      return (
        <t-button variant="dashed" onClick={() => handleGotoJudgeAccept(data.row.username)}>
          {acceptCount}
        </t-button>
      );
    },
  },
  {
    title: "提交",
    colKey: "attempt",
    cell: (_: any, data: any) => {
      let attemptCount = 0;
      if (data.row.attempt) {
        attemptCount = data.row.attempt;
      }
      return (
        <t-button variant="dashed" onClick={() => handleGotoJudgeAttempt(data.row.username)}>
          {attemptCount}
        </t-button>
      );
    },
  },
];

const dataLoading = ref(false);

let currentPage = 1;
let currentPageSize = 50;

const pagination = ref({
  current: currentPage,
  pageSize: currentPageSize,
  defaultCurrent: currentPage,
  defaultPageSize: currentPageSize,
  total: 0,
  pageSizeOptions: [50],
});

const problemViews = ref<UserRank[]>();

const handleGotoUsername = (username: string) => {
  router.push({ name: "user", params: { username: username } });
};

const handleGotoJudgeAccept = (username: string) => {
  router.push({ name: "judge-list", query: { username: username, status: JudgeStatus.Accept } });
};

const handleGotoJudgeAttempt = (username: string) => {
  router.push({ name: "judge-list", query: { username: username } });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    problemViews.value = [];
    const { current, pageSize } = paginationInfo;
    let res = null;
    switch (props.type) {
      case "problem":
        res = await GetRankACProblem(current, pageSize);
        break;
      case "problem-today":
        res = await GetRankACProblemToday(current, pageSize);
        break;
      case "problem-day7":
        res = await GetRankACProblemDay7(current, pageSize);
        break;
      case "problem-day30":
        res = await GetRankACProblemDay30(current, pageSize);
        break;
      case "problem-year":
        res = await GetRankACProblemYear(current, pageSize);
        break;
      default:
        res = await GetRankACAll(current, pageSize);
        break;
    }
    if (res.code === 0) {
      const responseList = res.data.list as UserRank[];
      if (!responseList || responseList.length <= 0) {
        pagination.value = { ...pagination.value, total: 0 };
        ShowTextTipsInfo(globalProperties, "未找到记录");
        return;
      }
      problemViews.value = [];
      const offsetStart = pagination.value.pageSize * (pagination.value.current - 1);
      let index = 1;
      responseList.forEach((item) => {
        const result = item;
        result.index = offsetStart + index++;
        problemViews.value?.push(result);
      });
      pagination.value = { ...pagination.value, total: res.data.total_count };
    } else {
      if (needLoading) {
        ShowErrorTips(globalProperties, res.code);
      }
    }
  } catch (err) {
    console.error(err);
    if (needLoading) {
      ShowErrorTips(globalProperties, GetCommonErrorCode());
    }
  } finally {
    if (needLoading) {
      dataLoading.value = false;
    }
  }
};

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};

// 初始化分页信息
onMounted(async () => {
  dataLoading.value = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      if (props.type && descriptionConfig[props.type]) {
        descriptionHeader.value = descriptionConfig[props.type].header;
        descriptionContent.value = descriptionConfig[props.type].content;
      } else {
        descriptionHeader.value = descriptionConfig.all.header;
        descriptionContent.value = descriptionConfig.all.content;
      }
      switch (props.type) {
        case "all":
          listColumns.value = userColumns.concat(acColumns);
          break;
        default:
          listColumns.value = userColumns.concat(problemColumns);
          break;
      }

      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
      fetchData({ current: currentPage, pageSize: currentPageSize }, true);
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-row>
    <t-col :span="9">
      <t-card style="margin: 10px">
        <t-table
          :data="problemViews"
          :columns="listColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          table-layout="auto"
          @page-change="onPageChange"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card" :header="descriptionHeader" :header-bordered="true">
          {{ descriptionContent }}
        </t-card>
      </div>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
