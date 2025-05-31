<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetCollectionRank } from "@/apis/collection.ts";
import type { CollectionRank, CollectionRankProblem, CollectionRankView } from "@/types/collection.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { JudgeStatus } from "@/apis/judge.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let collectionId = 0;

let problemCount = 0;

const listColumns = ref<BaseTableCol[]>([
  {
    title: "Rank",
    colKey: "rank",
    align: "center",
    cell: (_: any, data: any) => {
      return (
        <t-button
          variant="text"
          onClick={() =>
            router.push({
              name: "collection-user-rank",
              params: { collectionId, userId: data.row.user_id },
            })
          }
        >
          {data.row.rank}
        </t-button>
      );
    },
  },
  {
    title: "昵称",
    colKey: "nickname",
    cell: (_: any, data: any) => {
      return (
        <t-button
          variant="text"
          onClick={() =>
            router.push({
              name: "user",
              params: { username: data.row.username },
            })
          }
        >
          {data.row.nickname}
        </t-button>
      );
    },
  },
  {
    title: "Accept",
    colKey: "accept",
    align: "center",
    cell: (_: any, data: any) => {
      return (
        <t-button
          variant="text"
          onClick={() =>
            router.push({
              name: "judge-list",
              query: {
                username: data.row.username,
                status: JudgeStatus.Accept,
              },
            })
          }
        >
          {data.row.accept}
        </t-button>
      );
    },
  },
  {
    title: "Percent",
    colKey: "percent",
    cell: (_: any, data: any) => {
      if (problemCount === 0) {
        return "0%";
      }
      const percent = ((data.row.accept / problemCount) * 100).toFixed(2);
      return `${percent}%`;
    },
  },
  {
    title: "Count",
    colKey: "count",
    cell: (_: any, data: any) => {
      return `${data.row.accept} / ${problemCount}`;
    },
  },
  {
    title: "Progress",
    colKey: "progress",
    cell: (_: any, data: any) => {
      let percent = 100;
      if (problemCount > 0) {
        percent = (data.row.accept / problemCount) * 100;
      }
      return <t-progress percentage={percent} />;
    },
  },
]);

const dataLoading = ref(false);

const collectionRankViews = ref<CollectionRankView[]>();

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const res = await GetCollectionRank(collectionId);
    collectionRankViews.value = [];
    if (res.code === 0) {
      problemCount = res.data.problem;
      const responseList = res.data.ranks as CollectionRank[];
      const results = [];
      for (let i = 0; i < responseList.length; i++) {
        const item = responseList[i];
        let result = {
          userId: item.author_id,
          username: item.author_username,
          nickname: item.author_nickname,
        } as CollectionRankView;
        result.accept = item.accept;
        results.push(result);
      }
      results.sort((a: CollectionRankView, b: CollectionRankView) => {
        if (a.accept !== b.accept) {
          return b.accept - a.accept; // 降序
        }
        return a.userId - b.userId; // 升序
      });
      for (let i = 0; i < results.length; i++) {
        results[i].rank = i + 1;
      }
      collectionRankViews.value = results;
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

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    async (newQuery) => {
      if (Array.isArray(route.params.collectionId)) {
        collectionId = Number(route.params.collectionId[0]);
      } else {
        collectionId = Number(route.params.collectionId);
      }
      if (!collectionId) {
        await router.push({ name: "collection" });
        return;
      }
      await fetchData(true);
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
    <t-card style="margin: 10px">
      <div>
        <t-table :data="collectionRankViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" :loading="dataLoading" />
      </div>
    </t-card>
  </t-row>
</template>

<style scoped></style>
