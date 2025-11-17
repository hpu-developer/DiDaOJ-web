<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo } from "@/util/tips";
import { GetDiscussList, ParseDiscuss } from "@/apis/discuss.ts";
import { Discuss, DiscussView } from "@/types/discuss.ts";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { handleGotoProblem, handleGotoUsername } from "@/util/router.ts";
import { GetAvatarUrl } from "@/util/avatar.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

let contestId = -1;
let onlyProblemDiscuss = ref(false);

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
    colKey: "inserterNickname",
    width: "200",
    cell: (_: any, data: any) => {
      const avatarUrl = GetAvatarUrl(data.row.inserterUsername, data.row.inserterEmail);
      return (
        <t-space>
          <t-avatar shape="round" size="32px" image={avatarUrl} hide-on-load-failed={false} />
          <t-button variant="text" onClick={async () => await handleGotoUsername(router, data.row.inserterUsername)}>
            {data.row.inserterNickname}
          </t-button>
        </t-space>
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
  problemKey: "",
  title: "",
  username: "",
});

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
      problem_key: discussSearchForm.value.problemKey,
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
      onlyProblemDiscuss.value,
      contestId,
      discussSearchForm.value.problemKey,
      discussSearchForm.value.title,
      discussSearchForm.value.username,
      current,
      pageSize
    );
    discussViews.value = [];
    if (res.code === 0) {
      if (!res.data.has_auth) {
        ShowTextTipsInfo(globalProperties, "您目前没有权限查看讨论列表");
        if (contestId) {
          await router.push({ name: "contest-detail", params: { contestId: contestId } });
        } else {
          await router.push({ name: "discuss-list" });
        }
        return;
      }
      if (res.data.list) {
        const responseList = res.data.list as Discuss[];
        for (let i = 0; i < responseList.length; i++) {
          const item = responseList[i];
          const result = ParseDiscuss(item);
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

const handleCreateDiscuss = async () => {
  let query = {};
  if (discussSearchForm.value.problemKey) {
    query = {
      problem_key: discussSearchForm.value.problemKey,
    };
  }
  if (contestId) {
    query = {
      ...query,
      contest_id: contestId,
    };
  }
  await router.push({
    name: "discuss-create",
    query: query,
  });
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      if (!viewActive) {
        return;
      }
      onlyProblemDiscuss.value = route.name === "discuss-list-problem";

      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }

      listColumns.value = listColumns1;
      if (contestId) {
        listColumns.value = listColumns.value.concat([
          {
            title: "问题标识",
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
            title: "问题标识",
            colKey: "problemKey",
            width: "100",
            cell: (_: any, data: any) => {
              if (!data.row.problemKey) {
                return "";
              }
              return (
                <t-button variant="text" onClick={() => handleGotoProblem(data.row.problemKey)}>
                  {data.row.problemKey}
                </t-button>
              );
            },
          },
        ]);
      }
      listColumns.value = listColumns.value.concat(listColumns2 as BaseTableCol[]);

      discussSearchForm.value.problemKey = (newQuery.problem_key as string) || "";
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
        <t-table :data="discussViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true"
          :pagination="pagination" :loading="dataLoading" table-layout="auto" @page-change="onPageChange" />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card">
          <t-form :model="discussSearchForm" @submit="handleSearchDiscuss">
            <t-form-item label="问题标识">
              <t-input v-model="discussSearchForm.problemKey" placeholder="请输入完整问题标识"></t-input>
            </t-form-item>
            <t-form-item label="标题">
              <t-input v-model="discussSearchForm.title" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="创建人">
              <t-input v-model="discussSearchForm.username" placeholder="仅支持输入完整用户名"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" type="submit">提交</t-button>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card">
          <t-space>
            <t-button @click="handleCreateDiscuss">创建</t-button>
          </t-space>
        </t-card>

        <t-card class="sh-card" header="讨论区" :header-bordered="true">
          <p>
            友好交流，发言请遵守相关法律法规，请勿进行刷帖、指责、人身攻击等行为，管理员会对讨论区进行自动以及人工审核。
          </p>
          <p>
            请珍惜账号资源，管理员有可能对违规信息做出包括但不限删帖、禁言、封号、提交信息到有关学校（部门）等措施。
          </p>
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
