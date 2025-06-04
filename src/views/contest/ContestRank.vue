<script setup lang="tsx">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, GetEllipsisText, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetContestProblemIndexStr, GetContestRank } from "@/apis/contest.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { JudgeStatus } from "@/apis/judge.ts";
import type { WatchStopHandle } from "vue";
import type { ContestRank, ContestRankProblem, ContestRankView } from "@/types/contest.ts";
import { GetTimeStringBySeconds } from "@/time/library.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let contestId = 0;
let contestStartTime = null;
let contestEndTime = null;

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

const progressMarks = ref({
  0: "0°C",
  20: "20°C",
  40: "40°C",
  60: "60°C",
  80: <span style="color: #0052d9">80°C</span>,
  100: <span style="color: #0052d9">100°C</span>,
});

const listColumns1 = [
  {
    title: "Rank",
    colKey: "rank",
    align: "center",
    fixed: "left",
  },
  {
    title: "昵称",
    colKey: "nickname",
    fixed: "left",
    cell: (_: any, data: any) => {
      const text = GetEllipsisText(data.row.nickname, 18);
      return (
        <t-tooltip content={data.row.nickname}>
          <t-button
            variant="text"
            onClick={() =>
              router.push({
                name: "user",
                params: { username: data.row.username },
              })
            }
          >
            {text}
          </t-button>
        </t-tooltip>
      );
    },
  },
  {
    title: "Solved",
    colKey: "solved",
    align: "center",
    fixed: "left",
    cell: (_: any, data: any) => {
      return (
        <t-button
          variant="text"
          onClick={() =>
            router.push({
              name: "contest-judge",
              params: {
                contestId: contestId,
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
    fixed: "left",
    cell: (_: any, data: any) => {
      return getDurationText(data.row.penalty);
    },
  },
] as BaseTableCol[];

const listColumns = ref<BaseTableCol[]>([]);

const dataLoading = ref(false);

const contestRankViews = ref<ContestRankView[]>([]);

const rowspanAndColspan = ({ col, rowIndex }: any) => {
  let rowspan = 1;
  for (let i = rowIndex + 1; i < contestRankViews.value.length; i++) {
    if (contestRankViews.value[i].rank === contestRankViews.value[rowIndex].rank) {
      rowspan++;
    } else {
      break;
    }
  }
  if (col.colKey === "rank") {
    return {
      rowspan: rowspan,
    };
  }
};

const progressLabelRender = (h, { value }) => {
  // 转为时分秒
  return GetTimeStringBySeconds(value);
};

const handleProgressChange = (value: number) => {
  console.log(value);
};

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const res = await GetContestRank(contestId);
    listColumns.value = listColumns1;
    contestRankViews.value = [];
    if (res.code === 0) {
      res.data.problems.sort((a: number, b: number) => a - b);
      res.data.problems.forEach((problemIndex: number, _: number) => {
        listColumns.value.push({
          colKey: `problem_${problemIndex}`,
          align: "center",
          title: () => {
            return (
              <t-button
                variant="text"
                onClick={() =>
                  router.push({
                    name: "contest-problem-detail",
                    params: { contestId, problemIndex },
                  })
                }
              >
                {GetContestProblemIndexStr(problemIndex)}
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
      const contest = res.data.contest;
      contestStartTime = new Date(contest.start_time);
      contestEndTime = new Date(contest.end_time);
      const responseList = res.data.ranks as ContestRank[];
      const results = [];
      for (let i = 0; i < responseList.length; i++) {
        const item = responseList[i];
        let result = {
          userId: item.author_id,
          username: item.author_username,
          nickname: item.author_nickname,
        } as ContestRankView;
        let acCount = 0;
        let penalty = 0;
        item.problems.forEach((problem: ContestRankProblem) => {
          let acDuration = -1;
          if (problem.ac) {
            acCount++;
            acDuration = (new Date(problem.ac).getTime() - contestStartTime.getTime()) / 1000; // 转换为秒
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
      results.sort((a: ContestRankView, b: ContestRankView) => {
        if (a.solved !== b.solved) {
          return b.solved - a.solved; // 降序
        }
        return a.penalty - b.penalty; // 升序
      });
      const vMembers = contest.v_members;
      let rank = 0;
      let rankIncrement = 0;
      let lastAccept = -1;
      let lastPenalty = -1;
      for (let i = 0; i < results.length; i++) {
        results[i].index = i + 1;
        if (vMembers && vMembers.includes(results[i].userId)) {
          results[i].rank = "*";
        } else {
          rankIncrement++;
          if (results[i].solved !== lastAccept || results[i].penalty !== lastPenalty) {
            rank = rankIncrement; // 更新排名
            lastAccept = results[i].solved;
            lastPenalty = results[i].penalty;
          }
          results[i].rank = String(rank);
        }
      }
      contestRankViews.value = results;
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
    async () => {
      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }
      if (!contestId) {
        await router.push({ name: "contest" });
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
    <t-card style="margin: 10px; width: 100%">
      <div style="margin: 10px 10px 40px">
        <t-slider :marks="progressMarks" :max="1000000" :label="progressLabelRender" @change="handleProgressChange" />
      </div>
      <div class="table-scroll-wrapper">
        <t-table
          :data="contestRankViews"
          :columns="listColumns"
          row-key="index"
          vertical-align="middle"
          :bordered="true"
          :hover="true"
          table-layout="auto"
          :rowspan-and-colspan="rowspanAndColspan"
          :loading="dataLoading"
          class="dida-contest-rank-table"
        />
      </div>
    </t-card>
  </t-row>
</template>

<style scoped>
.table-scroll-wrapper {
  width: calc(100vw - 320px);
}
</style>
