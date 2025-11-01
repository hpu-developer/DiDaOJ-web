<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import router from "@/router";
import { GetUserInfo, GetVjudgeAcProblem, ParseUser } from "@/apis/user.ts";
import { ShowErrorTips, ShowTextTipsError, useCurrentInstance } from "@/util";
import { UserInfoView } from "@/types/user.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";
import { GetProblemAttemptStatus, ProblemAttemptStatus } from "@/apis/problem.ts";
import { useUserStore } from "@/stores/user.ts";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let currentUsername = "";

const userLoading = ref(false);
const userData = ref<UserInfoView | null>(null);

const problemsAccept = ref([] as any[]);
const problemsAttempt = ref([] as any[]);
let problemAttemptStatus = null as Record<string, ProblemAttemptStatus> | null;

const vjudgeAcProblems = ref({} as Record<string, string[]>);
const vjudgeFailProblems = ref({} as Record<string, string[]>);

const userLink = ref("");

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
      const vjudgeInfo = await GetVjudgeAcProblem(userData.value.vjudgeId);
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
    }

    const statics = res.data.statics;

    var chartDom = document.getElementById("ojStaticsDiv")!;
    var myChart = echarts.init(chartDom);
    var option: EChartsOption;

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

    option = {
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
        top: 30, // 上移日历位置
        left: 30,
        right: 30,
        cellSize: ["auto", 13],
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
    };

    myChart.setOption(option);

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
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="头像">
              <t-avatar shape="round" size="100px" :image="userData?.avatar" :hide-on-load-failed="false" />
            </t-descriptions-item>
            <t-descriptions-item label="用户序号">{{ userData?.id }}</t-descriptions-item>
            <t-descriptions-item label="昵称">{{ userData?.nickname }}</t-descriptions-item>
            <t-descriptions-item label="Slogan">{{ userData?.slogan }}</t-descriptions-item>
            <t-descriptions-item label="邮箱">{{ userData?.email }}</t-descriptions-item>
            <t-descriptions-item label="组织">{{ userData?.organization }}</t-descriptions-item>
            <t-descriptions-item label="通过数量">{{ userData?.accept }}</t-descriptions-item>
            <t-descriptions-item label="提交数量">{{ userData?.attempt }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <div>
          <div style="text-align: right; margin-right: 20px">
            <t-link :href="userLink" :underline="true">前往查看最近提交</t-link>
          </div>
          <div id="ojStaticsDiv" class="dida-statistics-chart"></div>
        </div>
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
</style>
