<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { LocationQuery, useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, GetEllipsisText, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetContestProblemIndexStr, GetContestRank } from "@/apis/contest.ts";
import { BaseTableCol } from "tdesign-vue-next/es/table/type";
import { JudgeStatus } from "@/apis/judge.ts";
import type { ContestRank, ContestRankProblem, ContestRankView } from "@/types/contest.ts";
import { GetSecondFromDuration, GetTimeStringBySeconds } from "@/time/library.ts";
import { StarIcon, StarFilledIcon } from "tdesign-icons-vue-next";
import { useContestStore } from "@/stores/contest.ts";
import { TNode } from "tdesign-vue-next/es/common";
import { GetAvatarUrl } from "@/util/avatar.ts";

const route = useRoute();
const router = useRouter();
const contestStore = useContestStore();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
let contestId = 0;
let contestStartTime = null as Date | null;
let contestEndTime = null as Date | null;
let lockRankDurationSeconds = 0;
const progressValue = ref(0);
const progressMax = ref(0);
const onlyShowStarMembers = ref(false);
const enableAnimation = ref(true);
const autoRefresh = ref(true);
const autoScroll = ref(false);
let fetchTimer: ReturnType<typeof setInterval> | null = null;
let updateProgressTimer: ReturnType<typeof setInterval> | null = null;

let scrollTimer = null;
let scrollSpeed = 1; // 每次滚动的像素数
let scrollInterval = 20; // 每次滚动间隔（毫秒）

let currentPage = 1;
let currentPageSize = 50;
const pagination = ref({
  current: currentPage,
  pageSize: currentPageSize,
  defaultCurrent: 1,
  defaultPageSize: 50,
  total: 0,
  pageSizeOptions: [50, 100, 1000],
});

const isUserBeStar = (userId: number) => {
  return contestStore && contestStore.isStarMember(contestId, userId);
};

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  pagination.value = { ...pagination.value, current: pageInfo.current, pageSize: pageInfo.pageSize };
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};

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

const progressMarks = ref({} as Record<number, string | TNode<{ value: number }>>);
type ProblemFirstAcRecord = {
  userId: number;
  ac: number;
};
let problemFirstAcRecords = {
  userId: 0,
  ac: -1,
} as Record<number, ProblemFirstAcRecord>;

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
    attrs: (data: any) => {
      let style = {};
      if (isUserBeStar(data.row.userId)) {
        style = { backgroundColor: "rgba(255,165,30,0.5)" };
      }
      return {
        style: style,
      };
    },
    cell: (_: any, data: any) => {
      const text = GetEllipsisText(data.row.nickname, 18);

      let starButton = null;
      if (isUserBeStar(data.row.userId)) {
        starButton = (
          <t-button
            shape="circle"
            variant="text"
            class="rank-unstar-button"
            onClick={() => {
              contestStore.removeStarMember(contestId, data.row.userId);
              loadProgress();
            }}
            v-slots={{
              icon: () => <StarFilledIcon />,
            }}
          />
        );
      } else {
        starButton = (
          <t-button
            shape="circle"
            variant="text"
            class="rank-star-button"
            onClick={() => {
              contestStore.addStarMember(contestId, data.row.userId);
              loadProgress();
            }}
            v-slots={{
              icon: () => <StarIcon />,
            }}
          ></t-button>
        );
      }
      const avatarUrl = GetAvatarUrl(data.row.username, data.row.email);
      return (
        <div class="rank-nickname-cell">
          <t-space>
            <t-avatar shape="round" size="32px" image={avatarUrl} hide-on-load-failed={false} />
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
            {starButton}
          </t-space>
        </div>
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
let fetchVMembersViews = [] as number[];
const contestRankViews = ref<ContestRankView[]>([]);
let lastContestRankView = [] as ContestRankView[];

const rowspanAndColspan = ({ col, rowIndex }: any) => {
  if (col.colKey === "rank") {
    let realCurrent = pagination.value.current;
    if (pagination.value.current > Math.ceil(contestRankViews.value.length / pagination.value.pageSize)) {
      realCurrent = Math.ceil(contestRankViews.value.length / pagination.value.pageSize);
    }
    let offset = pagination.value.pageSize * (realCurrent - 1);
    let rowspan = 1;
    for (let i = rowIndex + 1; offset + i < contestRankViews.value.length; i++) {
      if (contestRankViews.value[offset + i].rank === contestRankViews.value[offset + rowIndex].rank) {
        rowspan++;
      } else {
        break;
      }
    }
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
    if (!contestStartTime) {
      return;
    }
    progressValue.value = (new Date().getTime() - contestStartTime.getTime()) / 1000;
    const progressValueRealMax = Math.min(progressValue.value, progressMax.value);
    progressValue.value = Math.min(progressValue.value, progressValueRealMax);
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
    loadProgress();
    clearProgressTimer();
  }
};

const handleSwitchAutoScroll = (value: boolean) => {
  autoScroll.value = value;
  if (value) {
    startAutoScroll();
  } else {
    stopAutoScroll();
  }
};

const handleSwitchOnlyStar = () => {
  loadProgress();
  pagination.value = { ...pagination.value, current: 1 };
};

const loadProgress = () => {
  contestRankViews.value = [];
  let results = [];

  // 计算每一题的最早的ac记录
  problemFirstAcRecords = {};

  if (!contestStartTime) {
    return;
  }

  if (!fetchRankViews) {
    return;
  }

  for (let i = 0; i < fetchRankViews.length; i++) {
    const item = fetchRankViews[i];
    let result = {
      userId: item.inserter,
      username: item.inserter_username,
      nickname: item.inserter_nickname,
      email: item.inserter_email,
    } as ContestRankView;
    let acCount = 0;
    let penalty = 0;
    item.problems.forEach((problem: ContestRankProblem) => {
      let acDuration = -1;
      let lockCount = problem.lock || 0;
      problem.attempt = problem.attempt || 0;
      if (problem.ac) {
        let contestStartTimeGetTime = 0;
        if (contestStartTime) {
          contestStartTimeGetTime = contestStartTime.getTime();
        }
        acDuration = (new Date(problem.ac).getTime() - contestStartTimeGetTime) / 1000; // 转换为秒
        if (acDuration > progressValue.value) {
          // 如果滑倒最后并且还开着自动刷新，那么额外展示补题的提交
          if (!(autoRefresh.value && progressValue.value === progressMax.value)) {
            return;
          }
        }
        acCount++;
        penalty += acDuration;
        // 每一次尝试罚时20分钟
        penalty += problem.attempt * 20 * 60;

        if (problemFirstAcRecords[problem.index] === undefined) {
          problemFirstAcRecords[problem.index] = {
            userId: item.inserter,
            ac: acDuration,
          };
        } else if (problemFirstAcRecords[problem.index].ac > acDuration) {
          problemFirstAcRecords[problem.index].userId = item.inserter;
          problemFirstAcRecords[problem.index].ac = acDuration;
        }
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
    if (a.penalty !== b.penalty) {
      return a.penalty - b.penalty; // 升序
    }
    return a.userId - b.userId; // 按用户ID升序
  });

  const vMembers = fetchVMembersViews;
  let rank = 0;
  let rankIncrement = 0;
  let lastAccept = -1;
  let lastPenalty = -1;
  for (let i = 0; i < results.length; i++) {
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

  if (onlyShowStarMembers.value) {
    results = results.filter((item) => {
      return isUserBeStar(item.userId);
    });
  }

  const rows = document.querySelectorAll("tbody tr");

  // 第一步：构建 username => rect 映射
  const oldRectsMap = {} as Record<string, DOMRect>;
  lastContestRankView.forEach((row, index) => {
    const tr = rows[index];
    if (!tr) return;
    oldRectsMap[row.userId] = tr.getBoundingClientRect();
  });

  pagination.value = { ...pagination.value, total: results.length };

  contestRankViews.value = results;

  for (let i = 0; i < contestRankViews.value.length; i++) {
    contestRankViews.value[i].index = i + 1;
  }

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
  if (!contestStartTime) {
    return;
  }
  progressValue.value = value;
  const progressValueRealMax = Math.min(progressMax.value, (new Date().getTime() - contestStartTime?.getTime()) / 1000);
  progressValue.value = Math.min(progressValue.value, progressValueRealMax);
  loadProgress();
};

function startAutoScroll() {
  if (scrollTimer) return; // 已在滚动中则不重复启动

  scrollTimer = setInterval(() => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // 滚动到下一位置
    window.scrollTo(0, scrollTop + scrollSpeed);

    // 如果到达底部，则返回顶部
    if (scrollTop + clientHeight >= scrollHeight - 1) {
      window.scrollTo(0, 0);
    }
  }, scrollInterval);
}

function stopAutoScroll() {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

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
    pagination.value = { ...pagination.value, total: 0 };
    if (res.code === 0) {
      if (!res.data.has_auth) {
        ShowTextTipsInfo(globalProperties, "您目前没有权限查看比赛排名");
        await router.push({ name: "contest-detail", params: { contestId: contestId } });
        return;
      }
      res.data.contest.problems.sort((a: number, b: number) => a - b);
      res.data.contest.problems.forEach((problemIndex: number, _: number) => {
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
              const firstAcRecord = problemFirstAcRecords[problemIndex];
              if (firstAcRecord !== undefined) {
                const userId = data.row.userId as number;
                if (firstAcRecord.userId === userId) {
                  return {
                    style: {
                      backgroundColor: "rgba(65,155,5,0.5)",
                    },
                  };
                }
              }
              if (problem.acDuration > (contestEndTime - contestStartTime) / 1000) {
                return {
                  style: {
                    backgroundColor: "rgba(100,255,100,0.5)",
                  },
                };
              }
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
            if (problem.attempt > 0) {
              return {
                style: {
                  backgroundColor: "rgba(255,120,120,0.5)",
                },
              };
            }
            return {};
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
      if (res.data.is_locked && lockRankDurationSeconds > 0) {
        const lockTimeSeconds = Math.max(0, progressMax.value - lockRankDurationSeconds);
        progressMarks.value[lockTimeSeconds] = <span style="color: #0052d9">锁榜({GetTimeStringBySeconds(lockTimeSeconds)})</span>;
      }

      progressValue.value = Math.floor((new Date().getTime() - contestStartTime.getTime()) / 1000);
      const progressValueRealMax = Math.min(progressValue.value, progressMax.value);
      progressValue.value = Math.min(progressValue.value, progressValueRealMax);

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
    async (newQuery: LocationQuery) => {
      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }
      if (!contestId) {
        await router.push({ name: "contest" });
        return;
      }
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
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
  stopAutoScroll();
});
</script>

<template>
  <t-row>
    <t-card style="margin: 10px; width: 100%">
      <div style="margin: 10px 10px 40px">
        榜单时间 {{ GetTimeStringBySeconds(progressValue) }}
        <div style="text-align: right; margin-bottom: 10px">
          <t-space>
            <t-switch size="large" v-model="onlyShowStarMembers" @change="handleSwitchOnlyStar">
              <template #label="slotProps">{{ slotProps.value ? "仅展示收藏" : "未过滤收藏" }}</template>
            </t-switch>
            <t-switch size="large" v-model="enableAnimation">
              <template #label="slotProps">{{ slotProps.value ? "开启动画" : "关闭动画" }}</template>
            </t-switch>
            <t-switch size="large" v-model="autoRefresh" @change="handleSwitchAutoRefresh">
              <template #label="slotProps">{{ slotProps.value ? "自动刷新" : "关闭刷新" }}</template>
            </t-switch>
            <t-switch size="large" v-model="autoScroll" @change="handleSwitchAutoScroll">
              <template #label="slotProps">{{ slotProps.value ? "自动滚动" : "关闭滚动" }}</template>
            </t-switch>
          </t-space>
        </div>
        <t-slider
          v-model="progressValue"
          :marks="progressMarks"
          :max="progressMax"
          :label="progressLabelRender"
          :tooltip-props="{ placement: 'top' }"
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
          :pagination="pagination"
          @page-change="onPageChange"
        />
      </div>
    </t-card>
  </t-row>
</template>

<style scoped>
.table-scroll-wrapper {
  width: max(1400px, calc(100vw - 320px));
}

:deep(.rank-nickname-cell:hover .rank-star-button) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.rank-nickname-cell .rank-star-button) {
  display: none;
}
</style>
