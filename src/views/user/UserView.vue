<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import router from "@/router";
import { Compass1Icon, GenderFemaleIcon, GenderMaleIcon, User1Icon } from "tdesign-icons-vue-next";
import { GetUserInfo, GetVjudgeAcProblem, ParseUser } from "@/apis/user.ts";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsWarn } from "@/util/tips";
import { UserInfoView } from "@/types/user.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";
import { GetProblemAttemptStatus, ProblemAttemptStatus } from "@/apis/problem.ts";
import { useUserStore } from "@/stores/user.ts";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { GetJudgeReward, PostJudgeReward } from "@/apis/judge";
import { createFireworks } from "@/util/fireworks";
import { ShowTextTipsSuccess, ShowEnhancedExpTips } from "@/util/tips";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let currentUsername = "";

const userLoading = ref(false);
const userData = ref<UserInfoView | null>(null);
const vjudgeLoading = ref(false);

const problemsAccept = ref([] as any[]);
const problemsAttempt = ref([] as any[]);
let problemAttemptStatus = null as Record<string, ProblemAttemptStatus> | null;

const vjudgeAcProblems = ref({} as Record<string, string[]>);
const vjudgeFailProblems = ref({} as Record<string, string[]>);

const userLink = ref("");

// 评测奖励相关
const judgeRewards = ref([] as Array<{ id: number; key: string }>);
const rewardLoading = ref(false);

const getProblemTheme = (problemId: number) => {
  let theme = "default";
  if (!problemAttemptStatus) {
    return theme;
  }
  const status = problemAttemptStatus[problemId];
  if (status) {
    switch (status) {
      case ProblemAttemptStatus.Accept:
        theme = "success";
        break;
      case ProblemAttemptStatus.Attempt:
        theme = "warning";
        break;
    }
  }
  return theme;
};

const getProblemThemeAccept = (problemId: number) => {
  if (userStore.getUsername === currentUsername) {
    return "success";
  }
  return getProblemTheme(problemId);
};

const getProblemThemeAttempt = (problemId: number) => {
  if (userStore.getUsername === currentUsername) {
    return "warning";
  }
  return getProblemTheme(problemId);
};

const handleGotoVjudgeProblem = (oj: string, problemId: string) => {
  const url = `https://vjudge.net/problem/${oj}-${problemId}`;
  window.open(url, "_blank");
};

// 领取评测奖励
const handleClaimReward = async (problemId: number, problemKey: string) => {
  try {
    // 只发送问题id给服务器
    const res = await PostJudgeReward(problemId);
    if (res.code === 0) {
      // 从列表中移除该奖励
      const index = judgeRewards.value.findIndex((item) => item.id === problemId);
      if (index > -1) {
        judgeRewards.value.splice(index, 1);
      }

      // 领取成功
      ShowTextTipsSuccess(globalProperties, `成功领取题目 ${problemKey} 的奖励！`);
      createFireworks();
      ShowEnhancedExpTips(globalProperties, 50, 4000);

      // 更新用户等级和经验值信息
      if (res.data && userData.value) {
        if (res.data.level !== undefined) {
          userData.value.level = res.data.level;
        }
        if (res.data.experience_current_level !== undefined) {
          userData.value.experience_current_level = res.data.experience_current_level;
        }
        if (res.data.experience_upgrade !== undefined) {
          userData.value.experience_upgrade = res.data.experience_upgrade;
        }
      }
    } else {
      // 奖励已领取，显示警告提示
      if (res.data) {
        // 从列表中移除该奖励
        const index = judgeRewards.value.findIndex((item) => item.id === problemId);
        if (index > -1) {
          judgeRewards.value.splice(index, 1);
        }
        ShowTextTipsWarn(globalProperties, `题目 ${problemKey} 的奖励已领取！`);
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    }
  } catch (error) {
    console.error("领取评测奖励失败:", error);
  }
};

const loadProblemAttemptStatus = async () => {
  problemAttemptStatus = {};
  if (!userStore.isLogin()) {
    return;
  }
  if (userStore.getUsername === currentUsername) {
    return;
  }
  let problemIds = [] as number[];
  if (problemsAccept.value) {
    problemIds = problemIds.concat(problemsAccept.value.map((p) => p.id));
  }
  if (problemsAttempt.value) {
    problemIds = problemIds.concat(problemsAttempt.value.map((p) => p.id));
  }
  if (problemIds.length === 0) {
    return;
  }
  const res = await GetProblemAttemptStatus(problemIds);
  if (res.code === 0) {
    problemAttemptStatus = res.data;
  } else {
    ShowErrorTips(globalProperties, res.code, res.data);
  }
};

const loadVjudgeInfo = async (vjudgeId: string) => {
  vjudgeLoading.value = true;
  try {
    const vjudgeInfo = await GetVjudgeAcProblem(vjudgeId);
    if (vjudgeInfo) {
      vjudgeAcProblems.value = vjudgeInfo.acRecords;
      for (const oj in vjudgeAcProblems.value) {
        vjudgeAcProblems.value[oj].sort((a: string, b: string) => {
          if (a.length === b.length) {
            return a.localeCompare(b);
          }
          return a.length - b.length;
        });
      }
      vjudgeFailProblems.value = vjudgeInfo.failRecords;
      for (const oj in vjudgeFailProblems.value) {
        vjudgeFailProblems.value[oj].sort((a: string, b: string) => {
          if (a.length === b.length) {
            return a.localeCompare(b);
          }
          return a.length - b.length;
        });
      }
    }
  } finally {
    vjudgeLoading.value = false;
  }
};

const loadUserInfo = async (username: string) => {
  userLoading.value = true;
  const routeData = router.resolve({
    name: "judge-list",
    query: { username: username },
  });
  userLink.value = routeData.href;
  try {
    let res = await GetUserInfo(username);

    if (res.code !== 0) {
      userLoading.value = false;
      ShowErrorTips(globalProperties, res.code);
      await router.push({ name: "home" });
      return;
    }

    userData.value = ParseUser(res.data.user);

    // 确保等级和经验字段存在，设置默认值
    if (!userData.value.level) {
      userData.value.level = 0;
    }
    if (!userData.value.experience) {
      userData.value.experience = 0;
    }
    if (!userData.value.experience_current_level) {
      userData.value.experience_current_level = 0;
    }
    if (!userData.value.experience_upgrade) {
      userData.value.experience_upgrade = 100; // 默认第一级需要100经验
    }

    const compareFunc = (a: any, b: any) => {
      const problemKeyA = a.key as string;
      const problemKeyB = b.key as string;
      if (problemKeyA.length === problemKeyB.length) {
        return problemKeyA.localeCompare(problemKeyB);
      }
      return problemKeyA.length - problemKeyB.length;
    };

    const acProblems = res.data.problems_ac;
    if (acProblems) {
      acProblems.sort(compareFunc);
    }
    problemsAccept.value = acProblems;

    const attemptProblems = res.data.problems_attempt;
    if (attemptProblems) {
      attemptProblems.sort(compareFunc);
    }
    problemsAttempt.value = attemptProblems;

    webStyleStore.setTitle(userData.value.nickname + " - " + webStyleStore.getTitle);

    if (userData.value.vjudgeId) {
      loadVjudgeInfo(userData.value.vjudgeId);
    }

    const statics = res.data.statics;

    const chartDom = document.getElementById("ojStaticsDiv")!;
    if (!chartDom) {
      return;
    }
    const myChart = echarts.init(chartDom);

    const data: [string, number, number][] = [];

    if (statics) {
      for (const stat of statics) {
        const date = new Date(stat.date);
        data.push([echarts.time.format(date, "{yyyy}-{MM}-{dd}", false), stat.attempt - stat.accept, stat.accept]);
      }
    }

    // 自定义颜色映射函数
    function getColor(accept: number, attempt: number) {
      if (accept > 0) {
        // 绿色渐变：从浅绿到深绿 (柔和色调)
        const intensity = Math.min(accept, 20) / 20;
        return `rgb(${Math.floor(230 * (1 - intensity))}, ${Math.floor(230 + 25 * intensity)}, ${Math.floor(230 * (1 - intensity))})`;
      } else {
        // 红色渐变：从浅红到深红 (柔和色调)
        const intensity = Math.min(attempt, 10) / 10;
        return `rgb(${Math.floor(230 + 25 * intensity)}, ${Math.floor(230 * (1 - intensity))}, ${Math.floor(230 * (1 - intensity))})`;
      }
    }

    const option = {
      tooltip: {
        formatter: function (params: any) {
          const value = params.value;
          const dataStr = value[0].toString();
          return `${dataStr}<br/>accept:${value[2]}<br/>unaccept:${value[1]}`;
        },
      },
      visualMap: {
        show: false, // 隐藏顶部图例
      },
      calendar: {
        top: 50, // 上移日历位置
        left: 30,
        right: 30,
        cellSize: ["auto", "auto"],
        range: new Date().getFullYear(),
        itemStyle: {
          borderWidth: 0.5,
          borderColor: "#f5f5f5", // 柔和的边框颜色
        },
        yearLabel: { show: false },
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: data.map((item) => ({
          value: item,
          itemStyle: {
            color: getColor(item[2], item[1]),
          },
        })),
        emphasis: {
          itemStyle: {
            borderColor: "#333",
            borderWidth: 1,
          },
        },
      },
    } as EChartsOption;

    myChart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      myChart.resize({
        height: 200,
      });
    });
    resizeObserver.observe(chartDom!);

    // 获取评测奖励信息（仅当当前查看的用户是登录用户时）
    if (userStore.getUserId === userData.value.id) {
      try {
        rewardLoading.value = true;
        const res = await GetJudgeReward();
        if (res.code === 0) {
          judgeRewards.value = res.data || [];

          // 对奖励列表进行排序，使用与其他列表相同的排序逻辑
          judgeRewards.value.sort(compareFunc);
        }
      } catch (error) {
        console.error("获取评测奖励信息失败:", error);
      } finally {
        rewardLoading.value = false;
      }
    }

    await loadProblemAttemptStatus();
  } catch (e) {
    console.error(e);
    ShowTextTipsError(globalProperties, "获取用户信息失败");
    await router.push({ name: "home" });
  } finally {
    userLoading.value = false;
  }
};

onBeforeRouteUpdate(async (to: any, from: any, next: any) => {
  if (Array.isArray(to.params.username)) {
    currentUsername = to.params.username[0];
  } else {
    currentUsername = to.params.username;
  }
  if (!currentUsername) {
    await router.push({ name: "home" });
    return;
  }
  await loadUserInfo(currentUsername);
  next();
});

onMounted(async () => {
  if (Array.isArray(route.params.username)) {
    currentUsername = route.params.username[0];
  } else {
    currentUsername = route.params.username;
  }
  if (!currentUsername) {
    await router.push({ name: "home" });
    return;
  }
  await loadUserInfo(currentUsername);
});
</script>

<template>
  <t-loading :loading="userLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <t-card style="margin: 10px">
          <div style="text-align: right; margin-right: 20px">
            <t-link :href="userLink" :underline="true">前往查看最近提交</t-link>
          </div>
          <div id="ojStaticsDiv" class="dida-statistics-chart"></div>
        </t-card>
        <t-card style="margin: 10px" title="通过题目">
          <p v-if="!problemsAccept || problemsAccept.length === 0">
            <span>暂无通过题目</span>
          </p>
          <template v-else>
            <t-button
              class="dida-tag-button"
              v-for="problem in problemsAccept"
              :key="problem.id"
              size="small"
              variant="dashed"
              :theme="getProblemThemeAccept(problem.id)"
              @click="() => router.push({ name: 'problem-detail', params: { problemKey: problem.key } })"
            >
              {{ problem.key }}
            </t-button>
          </template>
        </t-card>

        <t-card style="margin: 10px" title="尝试题目" v-if="problemsAttempt && problemsAttempt.length > 0">
          <template v-for="problem in problemsAttempt" :key="problem.id">
            <t-button
              class="dida-tag-button"
              size="small"
              variant="dashed"
              :theme="getProblemThemeAttempt(problem.id)"
              @click="() => router.push({ name: 'problem-detail', params: { problemKey: problem.key } })"
            >
              {{ problem.key }}
            </t-button>
          </template>
        </t-card>
        <t-card style="margin: 10px" title="vjudge.net" v-if="userData?.vjudgeId">
          <template #actions>
            <t-link :href="'https://vjudge.net/user/' + userData?.vjudgeId" target="_blank">@{{ userData?.vjudgeId }} </t-link>
          </template>
          <t-loading :loading="vjudgeLoading" style="min-height: 200px">
            <div style="margin: 10px" v-if="vjudgeAcProblems && Object.keys(vjudgeAcProblems).length > 0">
              <div style="margin: 5px">
                <span>AC</span>
              </div>
              <t-descriptions layout="vertical" :bordered="true">
                <t-descriptions-item v-for="(problems, oj) in vjudgeAcProblems" :key="oj" :label="oj">
                  <t-button
                    class="dida-tag-button"
                    v-for="p in problems"
                    :key="p"
                    variant="dashed"
                    size="small"
                    @click="() => handleGotoVjudgeProblem(oj, p)"
                  >
                    {{ p }}
                  </t-button>
                </t-descriptions-item>
              </t-descriptions>
            </div>
            <div style="margin: 10px" v-if="vjudgeFailProblems && Object.keys(vjudgeFailProblems).length > 0">
              <div style="margin: 5px">
                <span>Fail</span>
              </div>
              <t-descriptions layout="vertical" :bordered="true">
                <t-descriptions-item v-for="(problems, oj) in vjudgeFailProblems" :key="oj" :label="oj">
                  <t-button
                    class="dida-tag-button"
                    v-for="p in problems"
                    :key="p"
                    variant="dashed"
                    size="small"
                    @click="() => handleGotoVjudgeProblem(oj, p)"
                  >
                    {{ p }}
                  </t-button>
                </t-descriptions-item>
              </t-descriptions>
            </div>
          </t-loading>
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="头像">
              <t-avatar shape="round" size="100px" :image="userData?.avatar" :hide-on-load-failed="false" />
            </t-descriptions-item>
            <t-descriptions-item label="用户序号">{{ userData?.id }}</t-descriptions-item>
            <t-descriptions-item label="用户名">
              <t-space>
                {{ userData?.username }}
                <div class="level-container">
                  <span class="level-text">Lv.{{ userData?.level }}</span>
                  <div class="level-badge"></div>
                </div>
              </t-space>
            </t-descriptions-item>
            <t-descriptions-item label="经验值" style="padding-top: 0">
              <div class="experience-container">
                <div class="experience-progress">
                  <div
                    class="experience-bar"
                    :style="{ width: Math.min(((userData?.experience_current_level || 0) / (userData?.experience_upgrade || 100)) * 100, 100) + '%' }"
                  ></div>
                </div>
                <div class="experience-text">{{ userData?.experience_current_level }} / {{ userData?.experience_upgrade }}</div>
              </div>
            </t-descriptions-item>
            <t-descriptions-item label="昵称"
              ><GenderFemaleIcon v-if="userData?.gender === 1" /><GenderMaleIcon v-else-if="userData?.gender === 2" /><User1Icon v-else />
              {{ userData?.nickname }}</t-descriptions-item
            >
            <t-descriptions-item label="Slogan">{{ userData?.slogan }}</t-descriptions-item>
            <t-descriptions-item label="邮箱">{{ userData?.email }}</t-descriptions-item>
            <t-descriptions-item label="组织">{{ userData?.organization }}</t-descriptions-item>
            <t-descriptions-item label="个人主页">
              <t-link v-if="userData?.blogUrl" :href="userData?.blogUrl" target="_blank">
                {{ userData?.blog }}
              </t-link>
              <span v-else>
                {{ userData?.blog }}
              </span>
            </t-descriptions-item>
            <t-descriptions-item label="通过数量">{{ userData?.accept }}</t-descriptions-item>
            <t-descriptions-item label="提交数量">{{ userData?.attempt }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <!-- 只有当前查看的是登录用户时，才显示奖励窗口 -->
        <!-- 货币栏 -->
        <t-card style="margin: 10px" v-if="userStore.getUserId === userData?.id">
          <div class="coin-display">
            <Compass1Icon size="24" class="coin-icon" />
            <span class="coin-value">{{ userData?.coin || 0 }}</span>
          </div>
        </t-card>

        <t-card title="首通奖励" style="margin: 10px" v-if="userStore.getUserId === userData?.id">
          <t-loading :loading="rewardLoading">
            <p v-if="judgeRewards.length === 0">
              <span>暂无未领取奖励的题目</span>
            </p>
            <template v-else>
              <t-button
                class="dida-tag-button"
                v-for="reward in judgeRewards"
                :key="reward.id"
                size="small"
                variant="dashed"
                theme="success"
                @click="handleClaimReward(reward.id, reward.key)"
              >
                {{ reward.key }}
              </t-button>
            </template>
          </t-loading>
        </t-card>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  min-height: 800px;
}

.dida-statistics-chart {
  margin: 10px;
  width: 100%;
  min-height: 220px;
}

/* 等级样式 */
.level-container {
  position: relative;
  display: inline-block;
}

.level-text {
  font-size: 1rem;
  color: #1677ff;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

.level-badge {
  position: absolute;
  top: -2px;
  left: -4px;
  right: -4px;
  bottom: -2px;
  background: linear-gradient(135deg, #66b1ff 0%, #1e88e5 100%);
  border-radius: 12px;
  z-index: 0;
  opacity: 0.2;
}

/* 经验条样式 */
.experience-container {
  width: 100%;
}

.experience-progress {
  width: 100%;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.experience-bar {
  height: 100%;
  background: linear-gradient(90deg, #1677ff 0%, #36cfc9 100%);
  border-radius: 6px;
  transition: width 0.3s ease-in-out;
  box-shadow: 0 0 10px rgba(22, 119, 255, 0.4);
}

.experience-text {
  font-size: 0.9rem;
  color: #666;
  text-align: right;
}

/* 金币展示样式 */
.coin-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
}

.coin-icon {
  color: #fa8c16;
  filter: drop-shadow(0 1px 2px rgba(250, 140, 22, 0.3));
}

.coin-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fa8c16;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.coin-display:hover .coin-value {
  transform: scale(1.05);
  text-shadow: 0 2px 4px rgba(250, 140, 22, 0.4);
}

/* 深色模式适配 */
:deep(.dark) .coin-label {
  color: #d9d9d9;
}
</style>
