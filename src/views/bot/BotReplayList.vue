<script setup lang="tsx">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo } from "@/util/tips";
import {
  GetBotReplayList,
  GetBotStatusStr,
  GetBotStatusTheme,
  IsBotStatusRunning,
  BotStatus,
  ParseBotReplay,
} from "@/apis/bot.ts";
import type { BotReplay, BotReplayView } from "@/types/bot.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

const dataLoading = ref(false);
const gameKey = ref<string | undefined>(undefined);

// 搜索表单
const searchForm = ref({
  gameKey: "",
});

// 分页信息
const pagination = ref({
  current: 1,
  pageSize: 20,
  defaultCurrent: 1,
  defaultPageSize: 20,
  total: 200,
  pageSizeOptions: [20, 100],
  showPageSize: false,
});

// 回放列表数据
const replayList = ref<BotReplayView[]>([]);

// 表格列配置
const listColumns = ref([
  {
    title: "回放ID",
    colKey: "id",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoReplay(data.row.gameKey, data.row.id)}>
          {data.row.id}
        </t-button>
      );
    },
  },
  {
    title: "游戏名称",
    colKey: "gameName",
  },
  {
    title: "状态",
    colKey: "status",
    align: "center",
    cell: (_: any, data: any) => {
      const status = data.row.status as BotStatus;
      const statusStr = GetBotStatusStr(status);
      const theme = GetBotStatusTheme(status);
      let finalElements = [];
      if (IsBotStatusRunning(status)) {
        finalElements.push(<t-loading text={statusStr} size="small" class="dida-status-loading"></t-loading>);
      } else {
        finalElements.push(<span>{statusStr}</span>);
      }
      return (
        <t-button theme={theme} variant="outline" disabled>
          {finalElements}
        </t-button>
      );
    },
  },
  {
    title: "玩家列表",
    colKey: "players",
    cell: (_: any, data: any) => {
      return (
        <t-space>
          {data.row.players.map((player: any) => (
            <t-tag key={player.id} variant="light">
              {player.nickname}
            </t-tag>
          ))}
        </t-space>
      );
    },
  },
  {
    title: "提交时间",
    colKey: "insertTime",
    width: 180,
  },
]);

// 跳转到回放详情
const handleGotoReplay = (gameKey: string, replayId: number) => {
  router.push({ path: `/bot/${gameKey}/replay/${replayId}` });
};

// 搜索表单提交
const handleSearchFormSubmit = async () => {
  await router.push({
    query: {
      ...route.query,
      page: 1,
      page_size: pagination.value.pageSize,
      game_key: searchForm.value.gameKey,
    },
  });
};

// 搜索表单重置
const handleSearchFormReset = async () => {
  searchForm.value.gameKey = "";
  await router.push({
    query: {
      ...route.query,
      page: 1,
      page_size: pagination.value.pageSize,
      game_key: "",
    },
  });
};

// 获取回放列表
const fetchData = async (page: number, pageSize: number) => {
  dataLoading.value = true;
  try {
    const res = await GetBotReplayList(gameKey.value, page, pageSize);
    if (res.code === 0) {
      const response = res.data;
      if (response.list && response.list.length > 0) {
        replayList.value = response.list.map((item: BotReplay) => ParseBotReplay(item));
      } else {
        replayList.value = [];
        ShowTextTipsInfo(globalProperties, "未找到记录");
      }
      // 更新分页总数
      if (response.total) {
        pagination.value.total = response.total;
      }
    } else {
      ShowErrorTips(globalProperties, res.code);
      replayList.value = [];
    }
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
    replayList.value = [];
  } finally {
    dataLoading.value = false;
  }
};

// 分页变化处理
const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  await router.push({
    query: { ...route.query, page: pageInfo.current },
  });
};

// 初始化
onMounted(async () => {
  watch(
    () => route.query,
    (newQuery) => {
      gameKey.value = (newQuery.game_key as string) || undefined;
      searchForm.value.gameKey = (newQuery.game_key as string) || "";
      
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      
      pagination.value = { ...pagination.value, current: queryPage, pageSize: queryPageSize };
      fetchData(queryPage, queryPageSize);
    },
    { immediate: true }
  );
});
</script>

<template>
  <t-card style="margin: 10px">
    <t-form layout="inline" @submit="handleSearchFormSubmit" @reset="handleSearchFormReset">
      <t-form-item label="游戏类型">
        <t-input v-model="searchForm.gameKey" placeholder="请输入游戏类型" />
      </t-form-item>
      <t-form-item>
        <t-space>
          <t-button theme="primary" type="submit">搜索</t-button>
          <t-button theme="default" variant="base" type="reset">重置</t-button>
        </t-space>
      </t-form-item>
    </t-form>

    <t-table
      :data="replayList"
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
</template>

<style scoped>
:deep(.dida-status-loading) {
  margin-right: 5px;
}
</style>