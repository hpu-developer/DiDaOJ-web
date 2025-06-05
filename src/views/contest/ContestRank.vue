<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, GetEllipsisText, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetContestProblemIndexStr, GetContestRank } from "@/apis/contest.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { JudgeStatus } from "@/apis/judge.ts";
import type { ContestRank, ContestRankProblem, ContestRankView } from "@/types/contest.ts";
import { GetSecondFromDuration, GetTimeStringBySeconds } from "@/time/library.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let contestId = 0;
let contestStartTime = null;
let contestEndTime = null;
let lockRankDurationSeconds = 0;
const progressValue = ref(0);
const progressMax = ref(0);
const autoRefresh = ref(true);
const enableAnimation = ref(true);
let fetchTimer: ReturnType<typeof setInterval> | null = null;
let updateProgressTimer: ReturnType<typeof setInterval> | null = null;

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
  const seconds = (duration % 60).toFixed(0).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const progressMarks = ref({} as Record<number, string>);

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

let fetchRankViews = [] as ContestRank[];
let fetchVMembersViews = [] as ContestRank[];
const contestRankViews = ref<ContestRankView[]>([]);
let lastContestRankView = [] as ContestRankView[];

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

const createProgressTimer = () => {
  if (fetchTimer) {
    clearInterval(fetchTimer);
  }
  // 每30秒真正获取一次数据
  fetchTimer = setInterval(() => {
    if (!viewActive) {
      return;
    }
    fetchData(false);
  }, 30000);
  // 每秒更新一次数值
  if (updateProgressTimer) {
    clearInterval(updateProgressTimer);
  }
  updateProgressTimer = setInterval(() => {
    if (!viewActive) {
      return;
    }
    progressValue.value = (new Date().getTime() - contestStartTime.getTime()) / 1000;
    loadProgress();
  }, 1000);
};

const clearProgressTimer = () => {
  if (fetchTimer) {
    clearInterval(fetchTimer);
    fetchTimer = null;
  }
  if (updateProgressTimer) {
    clearInterval(updateProgressTimer);
    updateProgressTimer = null;
  }
};

const handleSwitchAutoRefresh = async (value: boolean) => {
  autoRefresh.value = value;
  if (value) {
    await fetchData(false);
    createProgressTimer();
  } else {
    clearProgressTimer();
  }
};

const loadProgress = () => {
  contestRankViews.value = [];
  const results = [];
  for (let i = 0; i < fetchRankViews.length; i++) {
    const item = fetchRankViews[i];
    let result = {
      userId: item.author_id,
      username: item.author_username,
      nickname: item.author_nickname,
    } as ContestRankView;
    let acCount = 0;
    let penalty = 0;
    item.problems.forEach((problem: ContestRankProblem) => {
      let acDuration = -1;
      let lockCount = problem.lock || 0;
      if (problem.ac) {
        acDuration = (new Date(problem.ac).getTime() - contestStartTime.getTime()) / 1000; // 转换为秒
        if (acDuration > progressValue.value) {
          return;
        }
        acCount++;
        penalty += acDuration;
        // 每一次尝试罚时20分钟
        penalty += problem.attempt * 20 * 60;
      }
      if (lockCount > 0 && lockRankDurationSeconds > 0) {
        const lockTimeSeconds = progressMax.value - lockRankDurationSeconds;
        if (progressValue.value < lockTimeSeconds) {
          lockCount = 0;
        }
      }
      const problemIndex = problem.index;
      result[`problem_${problemIndex}`] = {
        acDuration: acDuration,
        attempt: problem.attempt || 0, // 尝试次数
        lock: lockCount, // 锁定状态
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
  const vMembers = fetchVMembersViews;
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

  const rows = document.querySelectorAll("tbody tr");

  // 第一步：构建 username => rect 映射
  const oldRectsMap = {} as Record<string, DOMRect>;
  lastContestRankView.forEach((row, index) => {
    const tr = rows[index];
    if (!tr) return;
    oldRectsMap[row.userId] = tr.getBoundingClientRect();
  });

  contestRankViews.value = results;
  lastContestRankView = [...contestRankViews.value];

  if (enableAnimation.value) {
    const newRectsMap = {} as Record<string, DOMRect>;

    const newRows = document.querySelectorAll("table tbody tr");
    contestRankViews.value.forEach((row, index) => {
      const tr = newRows[index];
      if (!tr) return;
      newRectsMap[row.userId] = tr.getBoundingClientRect();
    });

    requestAnimationFrame(() => {
      const newRows = document.querySelectorAll("table tbody tr");
      contestRankViews.value.forEach((row, index) => {
        const newRow = newRows[index];
        const oldRect = oldRectsMap[row.userId];
        const newRect = newRectsMap[row.userId];
        if (oldRect && newRect) {
          const dy = oldRect.top - newRect.top;
          if (dy !== 0) {
            newRow.style.transition = "none";
            newRow.style.transform = `translateY(${dy}px)`;
          }
        }
      });

      requestAnimationFrame(() => {
        const newRows = document.querySelectorAll("table tbody tr");
        newRows.forEach((row) => {
          row.style.transition = "transform 300ms ease";
          row.style.transform = "";
        });
      });
    });
  }
};

const handleProgressChange = (value: number) => {
  handleSwitchAutoRefresh(false);
  progressValue.value = value;
  const progressValueRealMax = (new Date().getTime() - contestStartTime.getTime()) / 1000;
  if (progressValue.value > progressValueRealMax) {
    progressValue.value = progressValueRealMax;
  }
  loadProgress();
};

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const res = await GetContestRank(contestId);
    listColumns.value = [...listColumns1];
    fetchRankViews = [];
    fetchVMembersViews = [];
    contestRankViews.value = [];
    if (res.code === 0) {
      if (!res.data.has_auth) {
        ShowTextTipsInfo(globalProperties, "您目前没有权限查看比赛排名");
        await router.push({ name: "contest-detail", params: { contestId: contestId } });
        return;
      }
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
            if (problem.lock > 0) {
              if (text) {
                text += " ";
              }
              text += `(+${problem.lock})`;
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
            if (problem.lock > 0) {
              return {
                style: {
                  backgroundColor: "rgb(255,180,50,0.5)",
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
      fetchRankViews = res.data.ranks as ContestRank[];
      fetchVMembersViews = res.data.v_members || [];

      progressMax.value = Math.floor((contestEndTime.getTime() - contestStartTime.getTime()) / 1000);
      progressMarks.value = {
        0: "0",
        [Math.floor(progressMax.value / 2)]: GetTimeStringBySeconds(Math.floor(progressMax.value / 2)),
        [progressMax.value]: GetTimeStringBySeconds(progressMax.value),
      };
      lockRankDurationSeconds = GetSecondFromDuration(contest.lock_rank_duration || 0);
      if (lockRankDurationSeconds > 0) {
        const lockTimeSeconds = progressMax.value - lockRankDurationSeconds;
        progressMarks.value[lockTimeSeconds] = `锁榜(${GetTimeStringBySeconds(lockTimeSeconds)})`;
      }

      progressValue.value = Math.floor((new Date().getTime() - contestStartTime.getTime()) / 1000);

      autoRefresh.value = true;
      createProgressTimer();

      loadProgress();
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
  clearProgressTimer();
});
</script>

<template>
  <t-row>
    <t-card style="margin: 10px; width: 100%">
      <div style="margin: 10px 10px 40px">
        <div style="text-align: right; margin-bottom: 10px">
          <t-space>
            <t-switch size="large" v-model="enableAnimation">
              <template #label="slotProps">{{ slotProps.value ? "开启动画" : "关闭动画" }}</template>
            </t-switch>
            <t-switch size="large" v-model="autoRefresh" @change="handleSwitchAutoRefresh">
              <template #label="slotProps">{{ slotProps.value ? "自动刷新" : "关闭刷新" }}</template>
            </t-switch>
          </t-space>
        </div>
        <t-slider
          v-model="progressValue"
          :marks="progressMarks"
          :max="progressMax"
          :label="progressLabelRender"
          :tooltip-props="{ placement: 'top' }"
          :input-number-props="{ theme: 'column', autoWidth: true, format: GetTimeStringBySeconds, onChange: handleProgressChange }"
          @change-end="handleProgressChange"
        />
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
  width: max(1400px, calc(100vw - 320px));
}
</style>
