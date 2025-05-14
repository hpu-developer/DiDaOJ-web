<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetProblemList, GetProblemTagList, ParseProblem, ProblemAttemptStatus } from "@/apis/problem.ts";
import { Problem, ProblemTag, ProblemView } from "@/types/problem.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const showMoreTags = ref(false);
const tagsMap = {} as { [key: number]: ProblemTag };
let problemAttemptStatus = {} as { [key: string]: ProblemAttemptStatus };

const ListColumns = ref([
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
          <t-button key={i} theme="default" variant="outline">
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
  defaultPageSize: currentPageSize,
  defaultCurrent: currentPage,
  total: 0,
  pageSizeOptions: [50, 100],
});

const problemViews = ref<ProblemView[]>();
const problemTags = ref<ProblemTag[]>();

const formItem = ref({
  title: "",
  tag: "",
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
      title: formItem.value.title,
      tag: formItem.value.tag,
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
    query: {
      ...route.query,
      title: "",
      tag: tag.name,
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetProblemList(formItem.value.title, formItem.value.tag, current, pageSize);
    problemViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as Problem[];
      if (!responseList || responseList.length <= 0) {
        pagination.value = { ...pagination.value, total: 0 };
        problemAttemptStatus = null;
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

  dataLoading.value = true

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
            formItem.value.title = (newQuery.title as string) || "";
            formItem.value.tag = (newQuery.tag as string) || "";
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
          :columns="ListColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="onPageChange"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card">
          <t-form :model="formItem">
            <t-form-item label="标题">
              <t-input v-model="formItem.title" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="标签">
              <t-input v-model="formItem.tag" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="handleClickSearch">搜索</t-button>
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
</style>
