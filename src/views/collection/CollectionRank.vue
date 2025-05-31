<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetCollectionProblemIndexStr, GetCollectionRank } from "@/apis/collection.ts";
import type { CollectionRank, CollectionRankProblem, CollectionRankView } from "@/types/collection.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { JudgeStatus } from "@/apis/judge.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let collectionId = 0;

const getDurationText = (duration: number) => {
  if (duration === undefined || duration === null) {
    return "-";
  }
  const hours = Math.floor(duration / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((duration % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (duration % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const listColumns1 = [
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
    }
  },
  {
    title: "Solved",
    colKey: "solved",
    align: "center",
    cell: (_: any, data: any) => {
      return (
        <t-button
          variant="text"
          onClick=
          {() =>
            router.push({
              name: "collection-judge",
              params: {
                collectionId: collectionId,
              },
              query: {
                username: data.row.username,
                status: JudgeStatus.Accept,
              },
            })
          }
        >
          {data.row.solved}
        </t-button>
      );
    },
  },
  {
    title: "Penalty",
    colKey: "penalty",
    align: "center",
    cell: (_: any, data: any) => {
      return getDurationText(data.row.penalty);
    },
  },
] as BaseTableCol[];

const listColumns = ref<BaseTableCol[]>([]);

const dataLoading = ref(false);

const collectionRankViews = ref<CollectionRankView[]>();

const updateWidth = () => {
  const width = document.body.clientWidth;
  if (width < 1000) {
    listColumns.value.forEach((col) => {
      col.width = "auto";
    });
  } else {
    listColumns.value.forEach((col) => {
      col.width = "150px";
    });
  }
};

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const res = await GetCollectionRank(collectionId);
    listColumns.value = listColumns1;
    collectionRankViews.value = [];
    if (res.code === 0) {
      res.data.problems.sort((a: number, b: number) => a - b);
      res.data.problems.forEach((problemIndex: number, _: number) => {
        listColumns.value.push({
          title: GetCollectionProblemIndexStr(problemIndex),
          colKey: `problem_${problemIndex}`,
          align: "center",
          title: (h, { colIndex }) => {
            return (
              <t-button
                variant="text"
                onClick={() =>
                  router.push({
                    name: "collection-problem-detail",
                    params: { collectionId, problemIndex },
                  })
                }
              >
                {GetCollectionProblemIndexStr(problemIndex)}
              </t-button>
            );
          },
          cell: (_: any, data: any) => {
            const problem = data.row[`problem_${problemIndex}`];
            if (!problem) {
              return "";
            }
            let text = "";
            if (problem.acDuration >= 0) {
              text = getDurationText(problem.acDuration);
            }
            if (problem.attempt > 0) {
              if (text) {
                text += " ";
              }
              text += `(-${problem.attempt})`;
            }
            return <span>{text}</span>;
          },
          attrs: (data: any) => {
            const problem = data.row[`problem_${problemIndex}`];
            if (!problem) {
              return {};
            }
            if (problem.acDuration >= 0) {
              return {
                style: {
                  backgroundColor: "rgba(130,255,30,0.5)",
                },
              };
            }
            return {
              style: {
                backgroundColor: "rgba(255,120,120,0.5)",
              },
            };
          },
        });
      });
      const startTime = new Date(res.data.start_time);
      const responseList = res.data.ranks as CollectionRank[];
      const results = [];
      for (let i = 0; i < responseList.length; i++) {
        const item = responseList[i];
        let result = {
          username: item.author_username,
          nickname: item.author_nickname,
        } as CollectionRankView;
        let acCount = 0;
        let penalty = 0;
        item.problems.forEach((problem: CollectionRankProblem, index: number) => {
          let acDuration = -1;
          if (problem.ac) {
            acCount++;
            acDuration = (new Date(problem.ac).getTime() - startTime.getTime()) / 1000; // 转换为秒
            penalty += acDuration;
            // 每一次尝试罚时20分钟
            penalty += problem.attempt * 20 * 60;
          }
          const problemIndex = problem.index;
          result[`problem_${problemIndex}`] = {
            acDuration: acDuration,
            attempt: problem.attempt,
          };
        });
        result.solved = acCount;
        result.penalty = penalty; // 转换为分钟
        results.push(result);
      }
      results.sort((a: CollectionRankView, b: CollectionRankView) => {
        if (a.solved !== b.solved) {
          return b.solved - a.solved; // 降序
        }
        return a.penalty - b.penalty; // 升序
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

      updateWidth();
      window.addEventListener("resize", updateWidth);
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  viewActive = false;
  window.removeEventListener("resize", updateWidth);
  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-row>
    <t-card style="margin: 10px">
      <div>
        <t-table :data="collectionRankViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" table-layout="auto" :loading="dataLoading" />
      </div>
    </t-card>
  </t-row>
</template>

<style scoped></style>
