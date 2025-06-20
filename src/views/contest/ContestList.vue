<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetContestList, ParseContest } from "@/apis/contest.ts";
import { handleGotoUsername } from "@/util/router.ts";
import { Contest, ContestView } from "@/types/contest.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const ListColumns = ref([
  {
    title: "ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoContest(data.row.id)}>
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
        <t-button variant="text" onClick={() => handleGotoContest(data.row.id)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "负责人",
    colKey: "ownerNickname",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoUsername(router, data.row.ownerUsername)}>
          {data.row.ownerNickname}
        </t-button>
      );
    },
  },
  {
    title: "权限",
    colKey: "private",
    cell: (_: any, data: any) => {
      return data.row.private ? "私有" : "公开";
    },
  },
  {
    title: "开始时间",
    colKey: "startTime",
  },
  {
    title: "结束时间",
    colKey: "endTime",
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

const contestViews = ref<ContestView[]>();

const contestSearchForm = ref({
  title: "",
  username: "",
});

const handleGotoContest = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ path: "/contest/" + id });
};

const handleSearchContest = async () => {
  await router.push({
    query: {
      ...route.query,
      title: contestSearchForm.value.title,
      username: contestSearchForm.value.username,
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const handleResetSearch = async () => {
  contestSearchForm.value.title = "";
  contestSearchForm.value.username = "";
  await router.push({
    query: {
      ...route.query,
      title: "",
      username: "",
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
    const res = await GetContestList(contestSearchForm.value.title, contestSearchForm.value.username, current, pageSize);
    contestViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as Contest[];
      for (let i = 0; i < responseList.length; i++) {
        const item = responseList[i];
        const result = ParseContest(item);
        contestViews.value?.push(result);
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

const handleCreateContest = () => {
  router.push({ name: "contest-create" });
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      contestSearchForm.value.title = (newQuery.title as string) || "";
      contestSearchForm.value.username = (newQuery.username as string) || "";
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
          :data="contestViews"
          :columns="ListColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          table-layout="auto"
          @page-change="onPageChange"
          style="white-space: nowrap"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card">
          <t-form :model="contestSearchForm" @submit="handleSearchContest" @reset="handleResetSearch">
            <t-form-item label="标题">
              <t-input v-model="contestSearchForm.title" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="负责人">
              <t-input v-model="contestSearchForm.username" placeholder="仅支持输入完整用户名"></t-input>
            </t-form-item>
            <t-form-item>
              <t-space>
                <t-button theme="primary" type="submit">提交</t-button>
                <t-button theme="danger" type="reset">重置</t-button>
              </t-space>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card">
          <t-space>
            <t-button @click="handleCreateContest">创建</t-button>
          </t-space>
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
