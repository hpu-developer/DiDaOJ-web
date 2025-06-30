<script setup lang="tsx">
import { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetHighlightKeyByJudgeLanguage, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import {
  GetJudgeJobList,
  GetJudgeStatusStr,
  IsJudgeStatusRunning,
  JudgeStatus,
  GetJudgeStatusOptions,
  ParseJudgeJob,
  GetJudgeJobCode,
  GetJudgeStatusTheme,
  IsJudgeStatusValid,
} from "@/apis/judge.ts";
import { handleGotoContestProblem } from "@/util/router.ts";
import { GetJudgeLanguageStr } from "@/apis/language.ts";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let refreshTimeout: ReturnType<typeof setTimeout>;

const codeShow = ref(false);
const showJudgeJob = ref<JudgeJobView | null>(null);

const isCodeLoading = ref(false);

let contestId = -1;

const searchForm = ref({
  problemId: "",
  username: "",
  language: undefined as JudgeLanguage | undefined,
  status: undefined as JudgeStatus | undefined,
});

const listColumns = ref([
  {
    title: "ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      let clickFunction = null;
      if (IsJudgeStatusValid(data.row.status) && IsJudgeLanguageValid(data.row.language)) {
        clickFunction = () => {
          handleGotoJudgeJob(data.row.id);
        };
      }
      return (
        <t-button variant="text" onClick={clickFunction}>
          {data.row.id}
        </t-button>
      );
    },
  },
  {
    title: "问题",
    colKey: "problemId",
    cell: (_: any, data: any) => {
      if (contestId) {
        return (
          <t-button variant="text" onClick={() => handleGotoContestProblem(contestId, data.row.contestProblemIndex)}>
            {GetContestProblemIndexStr(data.row.contestProblemIndex)}
          </t-button>
        );
      }
      return (
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.problemId)}>
          {data.row.problemId}
        </t-button>
      );
    },
  },
  {
    title: "状态",
    colKey: "status",
    align: "center",
    cell: (_: any, data: any) => {
      let clickFunction = null;
      if (IsJudgeStatusValid(data.row.status) && IsJudgeLanguageValid(data.row.language)) {
        clickFunction = () => {
          handleGotoJudgeJob(data.row.id);
        };
      }
      const status = data.row.status as JudgeStatus;
      const statusStr = GetJudgeStatusStr(status);
      let disabled = !IsJudgeStatusValid(status);
      const theme = GetJudgeStatusTheme(status);
      let finalElements = [];
      if (IsJudgeStatusRunning(status)) {
        finalElements.push(<t-loading text={data.row.state} size="small" class="dida-status-loading"></t-loading>);
      }
      finalElements.push(<span>{statusStr}</span>);
      return (
        <t-button theme={theme} variant="outline" onClick={clickFunction} disabled={disabled}>
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
      let disabled = !IsJudgeLanguageValid(data.row.language);
      return (
        <t-button theme="default" onClick={() => handleShowCode(data.row)} disabled={disabled}>
          {GetJudgeLanguageStr(data.row.language) + " / " + data.row.codeLength}
        </t-button>
      );
    },
  },
  {
    title: "作者",
    colKey: "inserter",
    width: 200,
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoUser(data.row.inserterUsername)}>
          {data.row.inserterNickname}
        </t-button>
      );
    },
  },
  {
    title: "提交时间",
    colKey: "insertTime",
    width: 180,
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
  total: 500,
  pageSizeOptions: [50, 100],
  showPageSize: false,
  totalContent: (h, value) => {
    return <div><t-tag>目前仅支持获取前10页数据</t-tag></div>;
  },
});

const judgeJobViews = ref<JudgeJobView[]>();

const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);
languageOptions.value = GetSubmitLanguages();
const judgeStatusOptions = ref([] as { label: string; value: JudgeStatus }[]);
judgeStatusOptions.value = GetJudgeStatusOptions();

const handleShowCode = async (jobView: JudgeJobView) => {
  isCodeLoading.value = true;
  codeShow.value = true;
  try {
    showJudgeJob.value = jobView;

    const res = await GetJudgeJobCode(Number(showJudgeJob.value.id));
    if (res.code === 0) {
      const response = res.data;
      const language = GetHighlightKeyByJudgeLanguage(response.language);

      showJudgeJob.value.code = `\`\`\`${language}\n${response.code}\n\`\`\``;
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } finally {
    isCodeLoading.value = false;
  }
};

const handleGotoProblem = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ path: "/problem/" + id });
};

const handleGotoJudgeJob = (id: string | undefined) => {
  if (!id) {
    return;
  }
  if (contestId > 0) {
    router.push({
      name: "contest-judge-detail",
      params: {
        contestId: contestId,
        judgeId: id,
      },
    });
  } else {
    router.push({
      name: "judge-detail",
      params: {
        judgeId: id,
      },
    });
  }
};

const handleGotoUser = (user: string) => {
  if (!user) {
    return;
  }
  router.push({ path: "/user/" + user });
};

const handleSearchFormSubmit = async () => {
  await router.push({
    query: {
      ...route.query,
      page: 1,
      page_size: currentPageSize,
      problem_id: searchForm.value.problemId,
      username: searchForm.value.username,
      language: searchForm.value.language,
      status: searchForm.value.status,
    },
  });
};

const handleSearchFormReset = async () => {
  searchForm.value.problemId = "";
  searchForm.value.username = "";
  searchForm.value.language = undefined;
  searchForm.value.status = undefined;
  await router.push({
    query: {
      ...route.query,
      page: 1,
      page_size: currentPageSize,
      problem_id: "",
      username: "",
      language: undefined,
      status: undefined,
    },
  });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  let needRefresh = false;
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetJudgeJobList(
      contestId,
      searchForm.value.problemId,
      searchForm.value.username,
      searchForm.value.language,
      searchForm.value.status,
      current,
      pageSize
    );
    judgeJobViews.value = [];
    if (res.code === 0) {
      if (!res.data.has_auth) {
        ShowTextTipsInfo(globalProperties, "您目前没有权限查看评测记录");
        if (contestId) {
          await router.push({ name: "contest-detail", params: { contestId: contestId } });
        } else {
          await router.push({ name: "judge-list" });
        }
        return;
      }
      if (res.data.list && res.data.list.length > 0) {
        const responseList = res.data.list as JudgeJob[];
        responseList.forEach((item) => {
          const result = ParseJudgeJob(item);
          judgeJobViews.value?.push(result);
          if (IsJudgeStatusRunning(item.status)) {
            needRefresh = true;
          }
        });
      } else {
        ShowTextTipsInfo(globalProperties, "未找到记录");
      }
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
    if (needRefresh && viewActive) {
      refreshTimeout = setTimeout(() => {
        fetchData({ current: currentPage, pageSize: currentPageSize }, false);
      }, 5000);
    }
  }
};

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current },
  });
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }
      searchForm.value.problemId = (newQuery.problem_id as string) || "";
      searchForm.value.username = (newQuery.username as string) || "";
      if (newQuery.language != undefined) {
        searchForm.value.language = Number(newQuery.language as string) as JudgeLanguage;
      } else {
        searchForm.value.language = undefined;
      }
      if (newQuery.status != undefined) {
        searchForm.value.status = Number(newQuery.status as string) as JudgeStatus;
      } else {
        searchForm.value.status = undefined;
      }
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      if (!pagination.value.pageSizeOptions.includes(currentPageSize)) {
        currentPageSize = pagination.value.defaultPageSize;
      }
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

  clearTimeout(refreshTimeout);
});
</script>

<template>
  <t-card style="margin: 10px">
    <t-form layout="inline" @submit="handleSearchFormSubmit" @reset="handleSearchFormReset">
      <t-form-item label="题号">
        <t-input v-model="searchForm.problemId" placeholder="请输入完整题号" />
      </t-form-item>
      <t-form-item label="用户">
        <t-input v-model="searchForm.username" placeholder="仅支持输入完整用户名" />
      </t-form-item>
      <t-form-item label="语言">
        <t-select v-model="searchForm.language" placeholder="请选择提交语言" auto-width clearable>
          <t-option v-for="item in languageOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
        </t-select>
      </t-form-item>
      <t-form-item label="状态">
        <t-select v-model="searchForm.status" placeholder="请选择评测状态" auto-width clearable>
          <t-option v-for="item in judgeStatusOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
        </t-select>
      </t-form-item>
      <t-form-item>
        <t-space>
          <t-button theme="primary" type="submit">搜索</t-button>
          <t-button theme="default" variant="base" type="reset">重置</t-button>
        </t-space>
      </t-form-item>
    </t-form>

    <t-table
      :data="judgeJobViews"
      :columns="listColumns"
      row-key="id"
      vertical-align="top"
      :hover="true"
      :pagination="pagination"
      :loading="dataLoading"
      @page-change="onPageChange"
      table-layout="auto"
    />
  </t-card>

  <t-dialog v-model:visible="codeShow" width="800px" :cancel-btn="null" :close-btn="false" @confirm="codeShow = false">
    <template #header>
      <t-link
        @click="
          () => {
            handleGotoJudgeJob(showJudgeJob?.id);
          }
        "
      >
        {{ showJudgeJob?.id + " - " + GetJudgeLanguageStr(showJudgeJob?.language ? showJudgeJob?.language : JudgeLanguage.Unknown) }}
      </t-link>
    </template>
    <t-loading :loading="isCodeLoading">
      <md-preview :model-value="showJudgeJob?.code" :code-foldable="false" style="min-height: 100px"></md-preview>
    </t-loading>
  </t-dialog>
</template>

<style scoped>
:deep(.dida-status-loading) {
  margin-right: 5px;
}
</style>
