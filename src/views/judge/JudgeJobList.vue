<script setup lang="tsx">
import { nextTick, WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetKeyByJudgeLanguage, GetSubmitLanguages, JudgeLanguage } from "@/apis/language.ts";
import {
  GetJudgeJobList,
  GetJudgeStatusStr,
  IsJudgeStatusRunning,
  JudgeStatus,
  GetJudgeStatusOptions,
  ParseJudgeJob,
  GetJudgeJobCode,
} from "@/apis/judge.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";
import type { ButtonProps } from "tdesign-vue-next";
import Vditor from "vditor";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let refreshTimeout: ReturnType<typeof setTimeout>;

const codeShow = ref(false);
const showJudgeJob = ref<JudgeJobView | null>(null);

const markdownCodeRef = ref<HTMLElement | null>(null);
const isCodeLoading = ref(false);

const searchForm = ref({
  problemId: "",
  username: "",
  language: undefined as JudgeLanguage | undefined,
  status: undefined as JudgeStatus | undefined,
});

const ListColumns = ref([
  {
    title: "ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoJudgeJob(data.row.id)}>
          {data.row.id}
        </t-button>
      );
    },
  },
  {
    title: "问题",
    colKey: "problemId",
    cell: (_: any, data: any) => {
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
        <t-button theme={theme} variant="outline" onClick={() => handleGotoJudgeJob(data.row.id)}>
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
      return (
        <t-button theme="default" onClick={() => handleShowCode(data.row)}>
          {data.row.language + " / " + data.row.codeLength}
        </t-button>
      );
    },
  },
  {
    title: "作者",
    colKey: "author",
    width: 200,
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoUser(data.row.authorUsername)}>
          {data.row.authorNickname}
        </t-button>
      );
    },
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
  current: currentPage,
  pageSize: currentPageSize,
  defaultCurrent: currentPage,
  defaultPageSize: currentPageSize,
  total: 0,
  pageSizeOptions: [50, 100],
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

    const res = await GetJudgeJobCode(showJudgeJob.value.id);
    if (res.code === 0) {
      const response = res.data
      const language = GetKeyByJudgeLanguage(response.language);

      const codeMarkdown = `\`\`\`${language}\n${response.code}\n\`\`\``;

      const options = {} as IPreviewOptions;
      showJudgeJob.value.code = await Vditor.md2html(codeMarkdown, options);

      await nextTick(() => {
        if (markdownCodeRef.value) {
          Vditor.highlightRender({ lineNumber: true, enable: true }, markdownCodeRef.value);
          enhanceCodeCopy(markdownCodeRef.value);
        }
      });
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

const handleGotoJudgeJob = (id: string) => {
  if (!id) {
    return;
  }
  router.push({
    name: "judge-detail",
    params: {
      judgeId: id,
    },
  });
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
      searchForm.value.problemId,
      searchForm.value.username,
      searchForm.value.language,
      searchForm.value.status,
      current,
      pageSize
    );
    judgeJobViews.value = [];
    if (res.code === 0) {
      if (res.data.list && res.data.list.length > 0) {
        const responseList = res.data.list as JudgeJob[];
        responseList.forEach((item) => {
          const result = ParseJudgeJob(item);
          judgeJobViews.value?.push(result);
          if (IsJudgeStatusRunning(item.status)) {
            needRefresh = true;
          }
        });
        pagination.value = { ...pagination.value, total: res.data.total_count };
      } else {
        ShowTextTipsInfo(globalProperties, "未找到记录");
        pagination.value = { ...pagination.value, total: 0 };
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
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
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
      :columns="ListColumns"
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
        {{ showJudgeJob?.id + " - " + showJudgeJob?.language }}
      </t-link>
    </template>
    <t-loading :loading="isCodeLoading">
      <div v-html="showJudgeJob?.code" ref="markdownCodeRef" style="min-height: 100px"></div>
    </t-loading>
  </t-dialog>
</template>

<style scoped>
:deep(.dida-status-loading) {
  margin-right: 5px;
}
</style>
