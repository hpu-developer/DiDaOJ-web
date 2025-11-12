<script setup lang="tsx">
import { computed, WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo } from "@/util/tips";
import { ProblemAttemptStatus, GetProblemDailyList, ParseProblemDaily } from "@/apis/problem.ts";
import { ProblemTag, ProblemDaily, ProblemDailyView } from "@/types/problem.ts";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();
const userStore = useUserStore();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

let tagsMap = {} as { [key: number]: ProblemTag };
let problemAttemptStatus = {} as { [key: string]: ProblemAttemptStatus };

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblem);
});

const listColumns = ref([
  {
    title: "日期",
    colKey: "key",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="dashed" onClick={() => handleGotoProblem(data.row.key)}>
          {data.row.key}
        </t-button>
      );
    },
  },
  {
    title: "问题标识",
    colKey: "problemKey",
    cell: (_: any, data: any) => {
      let theme = getProblemIdTheme(data.row.problemId);
      return (
        <t-button variant="dashed" theme={theme} onClick={() => handleGotoProblem(data.row.key)}>
          {data.row.problemKey}
        </t-button>
      );
    },
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.key)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "标签",
    colKey: "tags",
    cell: (_: any, data: any) => {
      const tags = data.row.tags;
      if (!tags || tags.length === 0) {
        return "";
      }
      let tagButtons = [];
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        tagButtons.push(
          <t-button key={i} theme="default" variant="outline" size="small" onClick={() => handleClickTag(tag)}>
            {tag.name}
          </t-button>
        );
      }
      return <t-space>{tagButtons}</t-space>;
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

const dataLoading = ref(false);

let currentPage = 1;
let currentPageSize = 50;

const pagination = ref({
  current: currentPage,
  pageSize: currentPageSize,
  defaultCurrent: currentPage,
  defaultPageSize: currentPageSize,
  total: 0,
  pageSizeOptions: [50, 100],
});

const problemViews = ref<ProblemDailyView[]>([]);

const searchProblemForm = ref({
  date: [] as string[],
  problemKey: "",
});

const handleGotoProblem = (key: string) => {
  if (!key) {
    return;
  }
  router.push({
    name: "problem-daily-detail",
    params: {
      dailyId: key,
    },
  });
};

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

const handleClickSearch = async () => {
  let dateStr = "";
  if (searchProblemForm.value.date && searchProblemForm.value.date.length > 1) {
    dateStr = searchProblemForm.value.date[0] + "~" + searchProblemForm.value.date[1];
  }
  // 更新 URL 查询参数
  await router.push({
    query: {
      ...route.query,
      date: dateStr,
      problem_key: searchProblemForm.value.problemKey,
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleClickReset = async () => {
  searchProblemForm.value.date = [];
  searchProblemForm.value.problemKey = "";
  // 更新 URL 查询参数
  await router.push({
    query: {
      ...route.query,
      date: "",
      problem_key: "",
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleClickTag = (tag: ProblemTag) => {
  if (!tag) {
    return;
  }
  router.push({
    name: "problem-list",
    query: {
      ...route.query,
      title: "",
      tag: tag.name,
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleClickCreate = () => {
  router.push({ name: "manage-problem-daily-create" });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    let startDate = "";
    if (searchProblemForm.value.date[0]) {
      startDate = searchProblemForm.value.date[0];
    }
    let endDate = "";
    if (searchProblemForm.value.date[1]) {
      endDate = searchProblemForm.value.date[1];
    }
    const res = await GetProblemDailyList(startDate, endDate, searchProblemForm.value.problemKey, current, pageSize);
    problemViews.value = [];
    if (res.code === 0) {
      let responseList = [] as ProblemDaily[];
      if (res.data) {
        responseList = res.data.list as ProblemDaily[];
      }
      if (!responseList || responseList.length <= 0) {
        pagination.value = { ...pagination.value, total: 0 };
        problemAttemptStatus = {};
        ShowTextTipsInfo(globalProperties, "未找到记录");
        return;
      }
      tagsMap = {};
      if (res.data.tags) {
        res.data.tags.forEach((tag: ProblemTag) => {
          tagsMap[tag.id] = tag;
        });
      }
      responseList.forEach((item: ProblemDaily) => {
        const result = ParseProblemDaily(item, tagsMap);
        problemViews.value?.push(result);
      });
      pagination.value = { ...pagination.value, total: res.data.total_count };
      problemAttemptStatus = res.data.attempt_status;
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

  dataLoading.value = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      if (!viewActive) {
        return;
      }
      searchProblemForm.value.date = [];
      if (newQuery.date) {
        const dateRange = (newQuery.date as string).split("~");
        if (dateRange.length === 2) {
          searchProblemForm.value.date = [dateRange[0], dateRange[1]];
        }
      }
      searchProblemForm.value.problemKey = (newQuery.problem_key as string) || "";
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
  viewActive = false;

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
          row-key="key"
          vertical-align="top"
          :hover="true"
          :pagination="pagination"
          table-layout="auto"
          :loading="dataLoading"
          @page-change="onPageChange"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <div v-if="hasEditAuth" class="dida-operation-container">
          <t-space>
            <t-button @click="handleClickCreate">新建</t-button>
          </t-space>
        </div>
        <t-card class="sh-card">
          <t-form :model="searchProblemForm" @submit="handleClickSearch" @reset="handleClickReset">
            <t-form-item label="日期" label-align="top">
              <t-date-range-picker v-model="searchProblemForm.date" allow-input clearable format="YYYY-MM-DD" />
            </t-form-item>
            <t-form-item label="问题" label-align="top">
              <t-input v-model="searchProblemForm.problemKey" placeholder="请输入问题标识" clearable></t-input>
            </t-form-item>
            <t-form-item label-align="top">
              <t-space>
                <t-button theme="primary" type="submit">搜索</t-button>
                <t-button theme="danger" type="reset">重置</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-card>

        <t-card class="sh-card" header="每日一题" :header-bordered="true">
          <p>由管理员团队精选的题目，每日0点更新。</p>
          <p>当日下午6点提供题解，次日提供AC代码。</p>
        </t-card>
      </div>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}

.sh-background-black {
  background-color: #212121;
}

.sh-tag-button {
  margin: 2px;
}

.dida-operation-container {
  margin: 10px 0 20px;
  text-align: right;
}
</style>
