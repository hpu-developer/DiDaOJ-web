<script setup lang="tsx">
import { computed, WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetProblemList, GetProblemTagList, ParseProblem, ProblemAttemptStatus, PostProblemCrawl } from "@/apis/problem.ts";
import { Problem, ProblemTag, ProblemView } from "@/types/problem.ts";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();
const userStore = useUserStore();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const showMoreTags = ref(false);
const tagsMap = {} as { [key: number]: ProblemTag };
let problemAttemptStatus = {} as { [key: string]: ProblemAttemptStatus };

const isCrawling = ref(false);

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblem);
});

const listColumns = ref([
  {
    title: "ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      let theme = getProblemIdTheme(data.row.id);
      return (
        <t-button variant="dashed" theme={theme} onClick={() => handleGotoProblem(data.row.id)}>
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

const problemViews = ref<ProblemView[]>();
const problemTags = ref<ProblemTag[]>();

const ojOptions = [
  { label: "DidaOJ", value: "didaoj" },
  { label: "HDU", value: "hdu" },
  { label: "POJ", value: "poj" },
  { label: "NYOJ", value: "nyoj" },
];

const searchProblemForm = ref({
  oj: "",
  title: "",
  tag: "",
  private: false,
});

const crawlProblemForm = ref({
  oj: "",
  problem: "",
});

const handleGotoProblem = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ path: "/problem/" + id });
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
  // 更新 URL 查询参数
  await router.push({
    query: {
      ...route.query,
      oj: searchProblemForm.value.oj,
      title: searchProblemForm.value.title,
      tag: searchProblemForm.value.tag,
      private: searchProblemForm.value.private ? "1" : "0",
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleClickReset = async () => {
  searchProblemForm.value.oj = "";
  searchProblemForm.value.title = "";
  searchProblemForm.value.tag = "";
  searchProblemForm.value.private = false;

  // 更新 URL 查询参数
  await router.push({
    query: {
      ...route.query,
      oj: "",
      title: "",
      tag: "",
      private: "0",
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleClickCrawl = async () => {
  try {
    isCrawling.value = true;
    const res = await PostProblemCrawl(crawlProblemForm.value.oj, crawlProblemForm.value.problem);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "搜索成功");
      await router.push({
        name: "problem-detail",
        params: { problemId: res.data },
      });
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    isCrawling.value = false;
  }
};

const handleClickTag = (tag: ProblemTag) => {
  if (!tag) {
    return;
  }
  router.push({
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
  router.push({ name: "manage-problem-create" });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetProblemList(searchProblemForm.value.oj, searchProblemForm.value.title, searchProblemForm.value.tag,
      searchProblemForm.value.private,
      current, pageSize);
    problemViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as Problem[];
      if (!responseList || responseList.length <= 0) {
        pagination.value = { ...pagination.value, total: 0 };
        problemAttemptStatus = {};
        ShowTextTipsInfo(globalProperties, "未找到记录");
        return;
      }
      responseList.forEach((item) => {
        const result = ParseProblem(item, tagsMap);
        problemViews.value?.push(result);
      });
      pagination.value = { ...pagination.value, total: res.data.total_count };
      problemAttemptStatus = res.data.problem_attempt_status;
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

  problemTags.value = [];
  GetProblemTagList(-1)
    .then((res) => {
      if (res.code === 0) {
        problemTags.value = res.data.list;
        showMoreTags.value = res.data.total_count > res.data.list.length;
        for (let i = 0; i < res.data.list.length; i++) {
          const tag = res.data.list[i] as ProblemTag;
          tagsMap[tag.id] = tag;
        }

        watchHandle = watch(
          () => route.query,
          (newQuery) => {
            searchProblemForm.value.oj = (newQuery.oj as string) || "";
            searchProblemForm.value.title = (newQuery.title as string) || "";
            searchProblemForm.value.tag = (newQuery.tag as string) || "";
            searchProblemForm.value.private = (newQuery.private as string) === "1";
            const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
            const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
            currentPage = queryPage;
            currentPageSize = queryPageSize;
            pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
            fetchData({ current: currentPage, pageSize: currentPageSize }, true);
          },
          { immediate: true }
        );
      } else {
        showMoreTags.value = true;
      }
    })
    .catch((err) => {
      console.error(err);
      showMoreTags.value = true;
    });
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
          row-key="id"
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
            <t-form-item label="OJ">
              <t-select v-model="searchProblemForm.oj" :options="ojOptions" placeholder="请选择OJ" clearable></t-select>
            </t-form-item>
            <t-form-item label="标题">
              <t-input v-model="searchProblemForm.title" placeholder="请输入关键词"></t-input>
            </t-form-item>
            <t-form-item label="标签">
              <t-input v-model="searchProblemForm.tag" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="私有" v-if="hasEditAuth">
              <t-switch v-model="searchProblemForm.private"></t-switch>
            </t-form-item>
            <t-form-item>
              <t-space>
                <t-button theme="primary" type="submit">搜索</t-button>
                <t-button theme="danger" type="reset">重置</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card">
          <t-form :model="crawlProblemForm" @submit="handleClickCrawl">
            <t-form-item label="OJ">
              <t-select v-model="crawlProblemForm.oj" :options="ojOptions" placeholder="请选择OJ" clearable></t-select>
            </t-form-item>
            <t-form-item label="题目">
              <t-input v-model="crawlProblemForm.problem" placeholder="请输入原始题号"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" type="submit" :loading="isCrawling">前往</t-button>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card sh-background-black">
          <t-button
            v-for="tag in problemTags"
            class="sh-tag-button"
            theme="default"
            variant="outline"
            :ghost="true"
            @click="() => handleClickTag(tag)"
          >
            {{ tag.name }}
          </t-button>
          <t-button
            v-if="showMoreTags"
            class="sh-tag-button"
            theme="default"
            variant="outline"
            :ghost="true"
            @click="() => $router.push('/problem/tags')"
          >
            ...
          </t-button>
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
