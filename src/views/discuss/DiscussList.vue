<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetDiscussList, ParseDiscuss, PostCreateDiscuss } from "@/apis/discuss.ts";
import { Discuss, DiscussCreateRequest, DiscussView } from "@/types/discuss.ts";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { handleGotoUsername } from "@/util/router.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
const modalShow = ref(false);
const confirmLoading = ref(false);

let contestId = -1;

const listColumns = ref<BaseTableCol[]>([] as BaseTableCol[]);

const listColumns1 = [] as BaseTableCol[];

const listColumns2 = [
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoDiscuss(data.row.id)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "创建人",
    colKey: "authorNickname",
    width: "200",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={async () => await handleGotoUsername(router, data.row.authorUsername)}>
          {data.row.authorNickname}
        </t-button>
      );
    },
  },
  {
    title: "创建时间",
    colKey: "insertTime",
    width: "180",
  },
  {
    title: "更新时间",
    colKey: "updateTime",
    width: "180",
  },
] as BaseTableCol[];

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

const discussViews = ref<DiscussView[]>();

const discussSearchForm = ref({
  problemId: "",
  title: "",
  username: "",
});

const discussCreateForm = ref<DiscussCreateRequest>({
  title: "",
  content: "",
});

const handleGotoProblem = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ name: "problem-detail", params: { problemId: id } });
};

const handleGotoContestProblem = (contestId: number, problemIndex: string) => {
  router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: problemIndex } });
};

const handleGotoDiscuss = (id: string) => {
  if (!id) {
    return;
  }
  if (contestId) {
    router.push({ name: "contest-discuss-detail", params: { contestId: contestId, discussId: id } });
    return;
  }
  router.push({ name: "discuss-detail", params: { discussId: id } });
};

const handleSearchDiscuss = async () => {
  await router.push({
    query: {
      ...route.query,
      problem_id: discussSearchForm.value.problemId,
      title: discussSearchForm.value.title,
      username: discussSearchForm.value.username,
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
    const res = await GetDiscussList(
      contestId,
      discussSearchForm.value.problemId,
      discussSearchForm.value.title,
      discussSearchForm.value.username,
      current,
      pageSize
    );
    discussViews.value = [];
    if (res.code === 0) {
      if (res.data.list) {
        const responseList = res.data.list as Discuss[];
        for (let i = 0; i < responseList.length; i++) {
          const item = responseList[i];
          const result = await ParseDiscuss(item);
          discussViews.value?.push(result);
        }
      }
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

const handleCreateDiscuss = () => {
  modalShow.value = true;
};

const handleConfirmCreate = async () => {
  confirmLoading.value = true;

  console.log("discussCreateForm", discussCreateForm.value);

  PostCreateDiscuss(discussCreateForm.value)
    .then((res) => {
      if (res.code === 0) {
        ShowTextTipsInfo(globalProperties, "创建比赛成功");
        modalShow.value = false;
        router.push({ path: "/discuss/" + res.data.id });
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    })
    .finally(() => {
      confirmLoading.value = false;
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

      listColumns.value = listColumns1;
      if (contestId) {
        listColumns.value = listColumns.value.concat([
          {
            title: "问题ID",
            colKey: "contestProblemIndex",
            width: "100",
            cell: (_: any, data: any) => {
              if (!data.row.contestProblemIndex) {
                return "";
              }
              return (
                <t-button variant="text" onClick={() => handleGotoContestProblem(contestId, data.row.contestProblemIndex)}>
                  {GetContestProblemIndexStr(data.row.contestProblemIndex)}
                </t-button>
              );
            },
          },
        ]);
      } else {
        listColumns.value = listColumns.value.concat([
          {
            title: "问题ID",
            colKey: "problemId",
            width: "100",
            cell: (_: any, data: any) => {
              if (!data.row.problemId) {
                return "";
              }
              return (
                <t-button variant="text" onClick={() => handleGotoProblem(data.row.problemId)}>
                  {data.row.problemId}
                </t-button>
              );
            },
          },
        ]);
      }
      listColumns.value = listColumns.value.concat(listColumns2 as BaseTableCol[]);

      discussSearchForm.value.problemId = (newQuery.problem_id as string) || "";
      discussSearchForm.value.title = (newQuery.title as string) || "";
      discussSearchForm.value.username = (newQuery.username as string) || "";
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
          :data="discussViews"
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
        <t-card class="sh-card">
          <t-form :model="discussSearchForm">
            <t-form-item label="问题ID">
              <t-input v-model="discussSearchForm.problemId" placeholder="请输入完整问题ID"></t-input>
            </t-form-item>
            <t-form-item label="标题">
              <t-input v-model="discussSearchForm.title" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="创建人">
              <t-input v-model="discussSearchForm.username" placeholder="仅支持输入完整用户名"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="handleSearchDiscuss">提交</t-button>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card">
          <t-space>
            <t-button @click="handleCreateDiscuss">创建</t-button>
          </t-space>
        </t-card>
      </div>
    </t-col>
  </t-row>

  <t-dialog v-model:visible="modalShow" header="创建讨论" @confirm="handleConfirmCreate" :confirm-loading="confirmLoading">
    <t-form :label-width="80" :model="discussCreateForm" @submit.prevent>
      <t-form-item label="标题">
        <t-input v-model="discussCreateForm.title" placeholder="请输入标题"></t-input>
      </t-form-item>
    </t-form>
  </t-dialog>
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
