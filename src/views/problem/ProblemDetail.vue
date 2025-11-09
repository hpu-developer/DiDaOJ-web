<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, WatchStopHandle } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetProblem, GetProblemDaily, ParseProblem, PostProblemCrawl } from "@/apis/problem.ts";
import { GetHighlightKeyByJudgeLanguage, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { ProblemTag, ProblemView } from "@/types/problem.ts";
import { PostJudgeJob } from "@/apis/judge.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetContestProblemIndexStr, GetContestProblemRealKey, GetContestProblems } from "@/apis/contest.ts";
import { handleGotoContestProblem, handleGotoLogin } from "@/util/router.ts";
import SecretPanel from "@/components/SecretPanel.vue";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
let watchHandle: WatchStopHandle | null = null;

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let problemDescription = ref("");

let problemKey = "";
let problemId = 0;
let dailyId = "";
let contestId = 0;
let problemIndex = ref(0);

const isContestProblem = ref(false);
const isDailyProblem = ref(false);

const problemLoading = ref(false);
const problemData = ref<ProblemView | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;
const codeEditRef = ref<HTMLElement | null>(null);
const problemCrawlLoading = ref(false);
const problemSubmitting = ref(false);

const tagsMap = {} as { [key: number]: ProblemTag };

const selectLanguage = ref("");
const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);

const contestProblems = ref([]);

const dailyUpdateProgressTimer = ref<number | null>(null);
const dailySolutionUnlockCountdown = ref(-1);
const dailyCodeUnlockCountdown = ref(-1);
const dailySolution = ref("");
const dailyCode = ref("");
let serverTimeOffset = 0;

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblem);
});

const hasEditDailyAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblemDaily);
});

const isLogin = computed(() => {
  return userStore.isLogin();
});

const createDailyTimer = () => {
  if (dailyUpdateProgressTimer.value) {
    clearInterval(dailyUpdateProgressTimer.value);
  }
  dailyUpdateProgressTimer.value = setInterval(() => {
    const solutionUnlock = dailySolutionUnlockCountdown.value <= 0;

    const serverTime = new Date(new Date().getTime() + serverTimeOffset);
    const duration = serverTime.getHours() * 60 * 60 + serverTime.getMinutes() * 60 + serverTime.getSeconds();
    const duration18 = 18 * 60 * 60;
    if (duration < duration18) {
      dailySolutionUnlockCountdown.value = duration18 - duration;
    } else {
      dailySolutionUnlockCountdown.value = -1;
    }
    dailyCodeUnlockCountdown.value = 24 * 60 * 60 - duration;
    if ((!solutionUnlock && dailySolutionUnlockCountdown.value <= 0) || dailyCodeUnlockCountdown.value <= 0) {
      loadDailyData();
    }
  }, 1000);
};

const clearDailyTimer = () => {
  if (dailyUpdateProgressTimer.value) {
    clearInterval(dailyUpdateProgressTimer.value);
    dailyUpdateProgressTimer.value = null;
  }
};

const handleClickTag = (tag: ProblemTag) => {
  if (!tag) {
    return;
  }
  router.push({
    name: "problem-list",
    query: {
      ...route.query,
      title: "",
      tag: tag.name,
    },
  });
};

const handleClickDailyEdit = async () => {
  if (!dailyId) {
    ShowTextTipsError(globalProperties, "每日问题标识无效");
    return;
  }
  await router.push({
    name: "manage-problem-daily",
    params: {
      dailyId: dailyId,
    },
  });
};

const handleClickEdit = async () => {
  let realProblemKey = problemKey;

  if (!realProblemKey) {
    try {
      const res = await GetContestProblemRealKey(contestId, problemIndex.value);
      if (res.code === 0) {
        realProblemKey = res.data;
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    } catch (error) {
      ShowTextTipsError(globalProperties, "获取题目ID失败，请稍后再试");
      return;
    }
  }

  await router.push({
    name: "manage-problem",
    params: {
      problemKey: realProblemKey,
    },
  });
};

const handleClickJudgeStatus = () => {
  if (problemKey) {
    router.push({
      name: "judge-list",
      query: {
        problem_key: problemKey,
      },
    });
  } else {
    router.push({
      name: "contest-judge",
      params: {
        contestId: contestId,
      },
      query: {
        problem_key: GetContestProblemIndexStr(problemIndex.value),
      },
    });
  }
};

const handleClickDiscuss = () => {
  if (problemKey) {
    router.push({
      name: "discuss-list-problem",
      query: {
        problem_key: problemKey,
      },
    });
  } else {
    router.push({
      name: "contest-discuss",
      params: {
        contestId: contestId,
      },
      query: {
        problem_key: GetContestProblemIndexStr(problemIndex.value),
      },
    });
  }
};

const handleClickStatistics = () => {
  router.push({
    name: "problem-statistics",
    params: {
      problemKey: problemKey,
    },
  });
};

const handleClickRecommend = () => {
  router.push({
    name: "problem-recommend",
    params: {
      problemKey: problemKey,
    },
  });
};

const handleClickCrawl = async () => {
  const originOj = problemData.value?.originOj;
  const originId = problemData.value?.originId;
  if (!originOj || !originId) {
    return;
  }

  try {
    problemCrawlLoading.value = true;
    const res = await PostProblemCrawl(originOj, originId);
    if (res.code === 0) {
      await fetchProblemData();
      ShowTextTipsInfo(globalProperties, "更新成功");
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (error) {
    ShowTextTipsError(globalProperties, "更新失败，请稍后再试");
  } finally {
    problemCrawlLoading.value = false;
  }
};

const handleSubmitCode = async () => {
  const selectValue = parseInt(selectLanguage.value);
  if (!IsJudgeLanguageValid(selectValue)) {
    ShowTextTipsError(globalProperties, "请选择所编写的语言");
    return;
  }
  const code = codeEditor?.getValue();
  if (!code) {
    ShowTextTipsError(globalProperties, "请输入所需提交的代码");
    return;
  }
  if (!problemKey && (!contestId || !problemIndex.value)) {
    ShowTextTipsError(globalProperties, "问题标识无效");
    return;
  }

  problemSubmitting.value = true;

  try {
    const res = await PostJudgeJob(problemId, contestId, problemIndex.value, selectValue, code);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    ShowTextTipsInfo(globalProperties, "提交成功，正在跳转到详情页面");

    const statusId = res.data.id;
    if (contestId) {
      await router.push({
        name: "contest-judge-detail",
        params: {
          contestId: contestId,
          judgeId: statusId,
        },
      });
    } else {
      await router.push({
        name: "judge-detail",
        params: {
          judgeId: statusId,
        },
      });
    }
  } finally {
    problemSubmitting.value = false;
  }
};

const onSelectLanguageChanged = (value: JudgeLanguage) => {
  if (!codeEditor) {
    return;
  }
  const model = codeEditor.getModel();
  if (!model) {
    return;
  }
  monaco.editor.setModelLanguage(model, GetHighlightKeyByJudgeLanguage(value));
};

const fetchProblemData = async () => {
  contestProblems.value = [];

  let res = await GetProblem(problemKey, contestId, problemIndex.value);

  if (res.code !== 0) {
    problemLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem" });
    return;
  }

  res.data.problem.tags = [];
  if (res.data.tags) {
    res.data.tags.forEach((tag: ProblemTag) => {
      tagsMap[tag.id] = tag;
    });
    res.data.problem.tags = res.data.tags.map((tag) => tag.id);
  }

  problemData.value = ParseProblem(res.data.problem, tagsMap);

  problemId = problemData.value.id;
  problemKey = problemData.value.key;

  webStyleStore.setTitle(problemData.value.title + " - " + webStyleStore.getRouteTitle);

  if (contestId) {
    res = await GetContestProblems(contestId);
    if (res.code === 0) {
      res.data.problems.sort((a: number, b: number) => a - b);
      contestProblems.value = res.data.problems;
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  }

  const originOj = problemData.value.originOj;
  languageOptions.value = GetSubmitLanguages(originOj);

  problemDescription.value = problemData.value.description as string;
  await nextTick(() => {
    if (!codeEditor && codeEditRef.value) {


      const codeTemplate = `#include <iostream>
using namespace std;
int main() {
\tint a, b;
\twhile (cin >> a >> b) {
// code-edit-start
{{ code }}
// code-edit-end
\t}
\treturn 0;
}`;

      const codeEditor = monaco.editor.create(codeEditRef.value, {
        value: codeTemplate,
        language: "cpp",
        minimap: { enabled: true },
        colorDecorators: true,
        readOnly: false,
        theme: "vs-dark",
      });

      const model = codeEditor.getModel();
      let decorationIds: string[] = [];

// 工具函数：动态查找可编辑区域
      function getEditableRange() {
        let startLine = 0, endLine = 0;
        for (let i = 1; i <= model.getLineCount(); i++) {
          const line = model.getLineContent(i);
          if (line.includes("code-edit-start")) startLine = i;
          if (line.includes("code-edit-end")) endLine = i;
        }
        // 如果标记没找到，返回空 Range
        if (!startLine || !endLine || endLine <= startLine) return null;
        return new monaco.Range(
          startLine + 1, 1,
          endLine - 1, model.getLineMaxColumn(endLine - 1)
        );
      }

// 工具函数：动态更新装饰（只读行视觉提示）
      function updateDecorations() {
        const editableRange = getEditableRange();
        if (!editableRange) return;
        decorationIds = model.deltaDecorations(decorationIds, [
          { range: new monaco.Range(1, 1, editableRange.startLineNumber - 1, 1), options: { isWholeLine: true, className: "readonly-line" } },
          { range: new monaco.Range(editableRange.endLineNumber + 1, 1, model.getLineCount(), 1), options: { isWholeLine: true, className: "readonly-line" } },
        ]);
      }

// 初始化一次装饰
      updateDecorations();

// 监听内容变化，动态计算允许编辑区域
      model.onDidChangeContent((e) => {
        const editableRange = getEditableRange();
        if (!editableRange) return;

        for (const change of e.changes) {
          if (!editableRange.containsRange(change.range)) {
            // 非法编辑 → 撤销
            codeEditor.trigger("prevent-edit", "undo", null);
          }
        }

        // 每次变化后更新装饰
        updateDecorations();
      });


    }
    problemLoading.value = false;
  });
};

const loadDailyData = async () => {
  clearDailyTimer();
  isDailyProblem.value = false;
  const res = await GetProblemDaily(dailyId);
  if (res.code !== 0) {
    return;
  }
  isDailyProblem.value = true;
  const daily = res.data.problem_daily;
  problemKey = daily.problem_key;
  dailySolution.value = daily.solution;
  dailyCode.value = daily.code;

  const serverTime = new Date(res.data.time);
  serverTimeOffset = serverTime.getTime() - new Date().getTime();
  const localTime = new Date(serverTime.getTime());
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, "0");
  const day = String(localTime.getDate()).padStart(2, "0");
  const timeId = `${year}-${month}-${day}`;
  if (dailyId === timeId) {
    // 如果是当日的每日一题，则获取距离18点的倒计时
    const duration = serverTime.getHours() * 60 * 60 + serverTime.getMinutes() * 60 + serverTime.getSeconds();
    const duration18 = 18 * 60 * 60;
    if (duration < duration18) {
      dailySolutionUnlockCountdown.value = duration18 - duration;
    } else {
      dailySolutionUnlockCountdown.value = -1;
    }
    dailyCodeUnlockCountdown.value = 24 * 60 * 60 - duration;
  }
  if (dailySolutionUnlockCountdown.value >= 0 || dailyCodeUnlockCountdown.value >= 0) {
    createDailyTimer();
  }
};

onMounted(async () => {
  watchHandle = watch(
    () => route.params,
    async () => {
      isDailyProblem.value = false;
      if (Array.isArray(route.params.problemKey)) {
        problemKey = route.params.problemKey[0];
      } else {
        problemKey = route.params.problemKey;
      }
      if (Array.isArray(route.params.dailyId)) {
        dailyId = route.params.dailyId[0];
      } else {
        dailyId = route.params.dailyId;
      }
      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }
      if (!problemKey && dailyId) {
        problemLoading.value = true;
        await loadDailyData();
        problemLoading.value = false;
      }
      if (!problemKey) {
        if (contestId) {
          if (Array.isArray(route.params.problemIndex)) {
            problemIndex.value = parseInt(route.params.problemIndex[0]);
          } else {
            problemIndex.value = parseInt(route.params.problemIndex);
          }
          if (!problemIndex.value) {
            ShowTextTipsError(globalProperties, "题目不存在");
            await router.push({
              name: "contest-detail",
              params: { contestId: contestId },
            });
            return;
          }
        } else {
          ShowTextTipsError(globalProperties, "题目不存在");
          if (dailyId) {
            await router.push({ name: "problem-daily-list" });
          } else {
            await router.push({ name: "problem" });
          }
        }
      }
      isContestProblem.value = !!contestId;

      problemLoading.value = true;

      await fetchProblemData();
    },
    { immediate: true }
  );
  if (codeEditRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      if (codeEditor) {
        codeEditor.layout();
      }
    });
    resizeObserver.observe(codeEditRef.value);
  }
});

onBeforeUnmount(() => {
  if (watchHandle) {
    watchHandle();
    watchHandle = null;
  }
  clearDailyTimer();
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <t-card style="margin: 10px">
          <md-preview :model-value="problemDescription" previewTheme="cyanosis" />
        </t-card>
        <t-card style="margin: 10px" v-if="isDailyProblem" title="题解">
          <SecretPanel v-if="dailySolutionUnlockCountdown < 0">
            <md-preview :model-value="dailySolution" previewTheme="cyanosis" />
          </SecretPanel>
          <div style="text-align: center" v-else>
            <div>
              <t-space>
                <p>距离解锁百分比</p>
                <t-progress
                  theme="circle"
                  :color="{ from: '#0052D9', to: '#00A870' }"
                  :percentage="100 - (dailySolutionUnlockCountdown / (18 * 60 * 60)) * 100"
                  :status="'active'"
                >
                  <template #label>{{ (100 - (dailySolutionUnlockCountdown / (18 * 60 * 60)) * 100).toFixed(3) }}% </template>
                  >
                </t-progress>
              </t-space>
            </div>
          </div>
        </t-card>
        <t-card style="margin: 10px" v-if="isDailyProblem" title="示例代码">
          <SecretPanel v-if="dailyCodeUnlockCountdown < 0">
            <md-preview :model-value="dailyCode" previewTheme="cyanosis" />
          </SecretPanel>
          <div style="text-align: center" v-else>
            <div>
              <t-space style="margin: 0 auto">
                <p>距离解锁百分比</p>
                <t-progress
                  theme="circle"
                  :color="{ from: '#0052D9', to: '#00A870' }"
                  :percentage="100 - (dailyCodeUnlockCountdown / (24 * 60 * 60)) * 100"
                  :status="'active'"
                >
                  <template #label>{{ (100 - (dailyCodeUnlockCountdown / (24 * 60 * 60)) * 100).toFixed(3) }}% </template>
                  >
                </t-progress>
              </t-space>
            </div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="4">
        <div class="dida-problems-container" v-if="contestId">
          <t-space style="flex-wrap: wrap">
            <t-button
              v-for="(item, index) in contestProblems"
              :key="index"
              :theme="item == problemIndex ? 'primary' : 'default'"
              @click="async () => await handleGotoContestProblem(contestId, item)"
            >
              {{ GetContestProblemIndexStr(item) }}
            </t-button>
          </t-space>
        </div>
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="标识" v-if="problemData?.key">{{ problemData?.key }}</t-descriptions-item>
            <t-descriptions-item label="标题">{{ problemData?.title }}</t-descriptions-item>
            <t-descriptions-item label="时间限制">{{ problemData?.timeLimit }}</t-descriptions-item>
            <t-descriptions-item label="内存限制">{{ problemData?.memoryLimit }}</t-descriptions-item>
            <t-descriptions-item label="判题方式">{{ problemData?.judgeType }}</t-descriptions-item>
            <t-descriptions-item label="正确提交" v-if="!isContestProblem">{{ problemData?.accept }} </t-descriptions-item>
            <t-descriptions-item label="提交总数" v-if="!isContestProblem">{{ problemData?.attempt }} </t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ problemData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{
              problemData?.inserterNickname ? problemData?.inserterNickname : problemData?.originAuthor
            }}</t-descriptions-item>
            <t-descriptions-item label="题目来源" v-if="!isContestProblem">
              <t-link v-if="problemData?.sourceUrl" :href="problemData?.sourceUrl" target="_blank">
                {{ problemData?.source }}
              </t-link>
              <span v-else>
                {{ problemData?.source }}
              </span>
            </t-descriptions-item>
            <t-descriptions-item label="是否私有" v-if="hasEditAuth">{{ problemData?.private ? "私有" : "公开" }} </t-descriptions-item>
            <t-descriptions-item v-if="problemData?.originUrl" label="原题链接">
              <t-link :href="problemData?.originUrl" target="_blank">
                {{ problemData?.originOj }} -
                {{ problemData?.originId }}
              </t-link>
            </t-descriptions-item>
            <t-descriptions-item label="标签" v-if="problemKey">
              <t-button
                class="dida-tag-button"
                v-for="tag in problemData?.tags"
                :key="tag.id"
                variant="dashed"
                size="small"
                @click="() => handleClickTag(tag)"
              >
                {{ tag.name }}
              </t-button>
            </t-descriptions-item>
          </t-descriptions>

          <div class="dida-operation-container">
            <t-space>
              <t-button @click="handleClickJudgeStatus">提交记录</t-button>
              <t-button @click="handleClickDiscuss">题目讨论</t-button>
              <t-button @click="handleClickStatistics" v-if="problemKey">题目统计</t-button>
              <t-button @click="handleClickRecommend" v-if="problemKey">题目推荐</t-button>
            </t-space>
          </div>
          <div class="dida-operation-container" v-if="(isDailyProblem && hasEditDailyAuth) || hasEditAuth || problemData?.originId">
            <t-space>
              <t-button v-if="isDailyProblem && hasEditDailyAuth" @click="handleClickDailyEdit">每日一题</t-button>
              <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
              <t-button v-if="problemData?.originId" @click="handleClickCrawl" :loading="problemCrawlLoading">更新描述 </t-button>
            </t-space>
          </div>

          <div class="dida-code-submit-div" v-if="isLogin">
            <t-space>
              <t-select v-model="selectLanguage" label="语言：" placeholder="请选择提交语言" auto-width clearable @change="onSelectLanguageChanged">
                <t-option v-for="item in languageOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
              </t-select>
              <t-button @click="handleSubmitCode" :loading="problemSubmitting">提交</t-button>
            </t-space>
            <div class="dida-code-editor-div">
              <div ref="codeEditRef" class="dida-code-editor"></div>
            </div>
          </div>
          <div style="text-align: center" v-else>
            <t-space>
              <t-button
                @click="
                  () => {
                    handleGotoLogin(router, globalProperties.$router.currentRoute.value.fullPath);
                  }
                "
                >登录后提交本题</t-button
              >
            </t-space>
          </div>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  min-height: 800px;
}

.dida-operation-container {
  margin: 10px 0 20px;
  text-align: right;
}

.dida-problems-container {
  margin: 20px;
}

.dida-code-submit-div {
  margin-top: 10px;
}

.dida-code-editor-div {
  width: 100%;
  margin-top: 10px;
}

.dida-code-editor {
  min-height: 500px;
}
</style>
