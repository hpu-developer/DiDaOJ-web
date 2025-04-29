<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetJudgeJobList, GetJudgeStatusStr, IsJudgeStatusRunning, JudgeStatus, ParseJudgeJob } from "@/apis/judge.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";
import type { ButtonProps } from "tdesign-vue-next";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const ListColumns = ref([
  {
    title: "ID",
    colKey: "id",
  },
  {
    title: "问题",
    colKey: "problemId",
  },
  {
    title: "状态",
    colKey: "status",
    align: "center",
    cell: (_: any, data: any) => {
      const status = data.row.status as JudgeStatus;
      const statusStr = GetJudgeStatusStr(status);
      let theme: ButtonProps["theme"];
      switch (status) {
        case JudgeStatus.Init:
        case JudgeStatus.Rejudge:
        case JudgeStatus.Compiling:
        case JudgeStatus.Running:
          theme = "default";
          break;
        case JudgeStatus.Accept:
          theme = "success";
          break;
        case JudgeStatus.PE:
          theme = "warning";
          break;
        default:
          theme = "danger";
          break;
      }
      let finalElements = [];
      if (IsJudgeStatusRunning(status)) {
        finalElements.push(<t-loading text={data.row.state} size="small" class="dida-status-loading"></t-loading>);
      }
      finalElements.push(<span>{statusStr}</span>);
      return (
        <t-button theme={theme} variant="outline">
          {finalElements}
        </t-button>
      );
    },
  },
  {
    title: "分数",
    colKey: "score",
  },
  {
    title: "时间",
    colKey: "time",
  },
  {
    title: "内存",
    colKey: "memory",
  },
  {
    title: "代码",
    colKey: "code",
    cell: (_: any, data: any) => {
      return <t-button theme="default">{data.row.language + " / " + data.row.codeLength}</t-button>;
    },
  },
  {
    title: "作者",
    colKey: "author",
  },
  {
    title: "提交时间",
    colKey: "approveTime",
    width: 180,
  },
]);

const dataLoading = ref(false);

let currentPage = 1;
let currentPageSize = 50;

const pagination = ref({
  defaultPageSize: currentPageSize,
  defaultCurrent: currentPage,
  total: 0,
  pageSizeOptions: [50, 100],
});

const judgeJobViews = ref<JudgeJobView[]>();

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetJudgeJobList(current, pageSize);
    judgeJobViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as JudgeJob[];
      responseList.forEach((item) => {
        const result = ParseJudgeJob(item);
        judgeJobViews.value?.push(result);
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
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, defaultCurrent: currentPage, defaultPageSize: currentPageSize };
      fetchData({ current: currentPage, pageSize: currentPageSize }, true);
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  viewActive = false;

  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-card style="margin: 10px">
    <t-table
      :data="judgeJobViews"
      :columns="ListColumns"
      row-key="id"
      vertical-align="top"
      :hover="true"
      :pagination="pagination"
      :loading="dataLoading"
      @page-change="onPageChange"
    />
  </t-card>
</template>

<style scoped>
:deep(.dida-status-loading) {
  margin-right: 5px;
}
</style>
