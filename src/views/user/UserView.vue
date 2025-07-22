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

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let currentUsername = "";

const userLoading = ref(false);
const userData = ref<UserInfoView | null>(null);

const problemsAc = ref([] as string[]);
let problemAttemptStatus = null as Record<string, ProblemAttemptStatus> | null;

const vjudgeAcProblems = ref({} as Record<string, string[]>);
const vjudgeFailProblems = ref({} as Record<string, string[]>);

const getProblemTheme = (problemId: string) => {
  if (userStore.getUsername === currentUsername) {
    return "success";
  }
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
  if (problemsAc.value.length === 0) {
    return;
  }
  const res = await GetProblemAttemptStatus(problemsAc.value);
  if (res.code === 0) {
    problemAttemptStatus = res.data;
  } else {
    ShowErrorTips(globalProperties, res.code, res.data);
  }
};
const loadUserInfo = async (username: string) => {
  userLoading.value = true;
  try {
    let res = await GetUserInfo(username);

    if (res.code !== 0) {
      userLoading.value = false;
      ShowErrorTips(globalProperties, res.code);
      await router.push({ name: "home" });
      return;
    }

    userData.value = ParseUser(res.data.user);

    const acProblems = res.data.problems_ac;
    acProblems.sort((a: string, b: string) => {
      if (a.length === b.length) {
        return a.localeCompare(b);
      }
      return a.length - b.length;
    });
    problemsAc.value = acProblems;

    webStyleStore.setTitle(userData.value.nickname + " - " + webStyleStore.getTitle);

    if (userData.value.vjudgeId) {
      const vjudgeInfo = await GetVjudgeAcProblem(userData.value.vjudgeId);
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

    await loadProblemAttemptStatus();
  } catch (e) {
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
        <t-card style="margin: 10px" title="AC题目">
          <p v-if="problemsAc.length === 0">
            <span>暂无AC题目</span>
          </p>
          <template v-else>
            <t-button
              class="dida-tag-button"
              v-for="problem in problemsAc"
              :key="problem"
              size="small"
              variant="dashed"
              :theme="getProblemTheme(problem)"
              @click="() => router.push({ name: 'problem-detail', params: { problemKey: problem } })"
            >
              {{ problem }}
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
            <t-descriptions-item label="昵称">{{ userData?.nickname }}</t-descriptions-item>
            <t-descriptions-item label="Slogan">{{ userData?.slogan }}</t-descriptions-item>
            <t-descriptions-item label="邮箱">{{ userData?.email }}</t-descriptions-item>
            <t-descriptions-item label="组织">{{ userData?.organization }}</t-descriptions-item>
            <t-descriptions-item label="通过数量">{{ userData?.accept }}</t-descriptions-item>
            <t-descriptions-item label="提交数量">{{ userData?.attempt }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  min-height: 800px;
}
</style>
