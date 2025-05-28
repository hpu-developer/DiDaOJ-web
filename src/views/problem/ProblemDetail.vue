<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetProblem, ParseProblem, PostProblemCrawl } from "@/apis/problem.ts";
import { GetKeyByJudgeLanguage, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import { ProblemTag, ProblemView } from "@/types/problem.ts";
import { PostJudgeJob } from "@/apis/judge.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let content = ref("");

let problemId = "";
let contestId = 0;
let problemIndex = 0;

const markdownRef = ref<HTMLElement | null>(null);
const problemLoading = ref(false);
const problemData = ref<ProblemView | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;
const codeEditRef = ref<HTMLElement | null>(null);
const problemCrawlLoading = ref(false);

const tagsMap = {} as { [key: number]: ProblemTag };

const selectLanguage = ref("");
const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);

languageOptions.value = GetSubmitLanguages();

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblem);
});

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

const handleClickEdit = () => {
  router.push({
    name: "manage-problem",
    params: {
      problemId: problemId,
    },
  });
};

const handleClickJudgeStatus = () => {
  if (problemId) {
    router.push({
      name: "judge-list",
      query: {
        problem_id: problemId,
      },
    });
  } else {
    router.push({
      name: "contest-judge",
      params: {
        contestId: contestId,
      },
      query: {
        problem_id: GetContestProblemIndexStr(problemIndex),
      },
    });
  }
};

const handleClickDiscuss = () => {
  if (problemId) {
    router.push({
      name: "discuss-list-problem",
      query: {
        problem_id: problemId,
      },
    });
  } else {
    router.push({
      name: "contest-discuss",
      params: {
        contestId: contestId,
      },
      query: {
        problem_id: GetContestProblemIndexStr(problemIndex),
      },
    });
  }
};

const handleClickRecommend = () => {
  router.push({
    name: "problem-recommend",
    params: {
      problemId: problemId,
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
    ShowErrorTips(globalProperties, "更新失败，请稍后再试");
  } finally {
    problemCrawlLoading.value = false;
  }
};

const handleSubmitCode = async () => {
  if (!problemId) {
    ShowTextTipsError(globalProperties, "问题ID无效");
    return;
  }
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

  const res = await PostJudgeJob(problemId, contestId, problemIndex, selectValue, code);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }

  ShowTextTipsInfo(globalProperties, "提交成功，正在跳转到详情页面");

  const statusId = res.data.id;
  await router.push({ path: "/judge/" + statusId });
};

const onSelectLanguageChanged = (value: JudgeLanguage) => {
  if (!codeEditor) {
    return;
  }
  const model = codeEditor.getModel();
  if (!model) {
    return;
  }
  monaco.editor.setModelLanguage(model, GetKeyByJudgeLanguage(value));
};

const fetchProblemData = async () => {
  let res = await GetProblem(problemId, contestId, problemIndex);

  if (res.code !== 0) {
    problemLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem" });
    return;
  }

  if (res.data.tags) {
    res.data.tags.forEach((tag: ProblemTag) => {
      tagsMap[tag.id] = tag;
    });
  }

  problemData.value = ParseProblem(res.data.problem, tagsMap);

  webStyleStore.setTitle(problemData.value.title + " - " + webStyleStore.getTitle);

  let problemDescription = problemData.value.description as string;

  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
  } as IPreviewOptions;
  content.value = await Vditor.md2html(problemDescription, options);
  await nextTick(() => {
    if (markdownRef.value) {
      Vditor.mathRender(markdownRef.value);
      Vditor.highlightRender({ lineNumber: true, enable: true }, markdownRef.value);
      enhanceCodeCopy(markdownRef.value);

      if (!codeEditor && codeEditRef.value) {
        codeEditor = monaco.editor.create(codeEditRef.value, {
          value: "",
          language: "cpp",
          minimap: {
            enabled: true,
          },
          colorDecorators: true, //颜色装饰器
          readOnly: false, //是否开启已读功能
          theme: "vs-dark", //主题
        });
      }
    }
    problemLoading.value = false;
  });
};

onMounted(async () => {
  if (Array.isArray(route.params.problemId)) {
    problemId = route.params.problemId[0];
  } else {
    problemId = route.params.problemId;
  }
  if (!problemId) {
    if (Array.isArray(route.params.contestId)) {
      contestId = Number(route.params.contestId[0]);
    } else {
      contestId = Number(route.params.contestId);
    }
    if (!contestId) {
      ShowTextTipsError(globalProperties, "题目不存在");
      await router.push({ name: "problem" });
      return;
    }
    if (Array.isArray(route.params.problemIndex)) {
      problemIndex = parseInt(route.params.problemIndex[0]);
    } else {
      problemIndex = parseInt(route.params.problemIndex);
    }
    if (!problemIndex) {
      ShowTextTipsError(globalProperties, "题目不存在");
      await router.push({ name: "problem" });
      return;
    }
  }

  problemLoading.value = true;

  await fetchProblemData();
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <t-card style="margin: 10px">
          <div v-html="content" ref="markdownRef"></div>
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="标题">{{ problemData?.title }}</t-descriptions-item>
            <t-descriptions-item label="时间限制">{{ problemData?.timeLimit }}</t-descriptions-item>
            <t-descriptions-item label="内存限制">{{ problemData?.memoryLimit }}</t-descriptions-item>
            <t-descriptions-item label="判题方式">{{ problemData?.judgeType }}</t-descriptions-item>
            <t-descriptions-item label="正确提交">{{ problemData?.accept }}</t-descriptions-item>
            <t-descriptions-item label="提交总数">{{ problemData?.attempt }}</t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ problemData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{ problemData?.creatorNickname }}</t-descriptions-item>
            <t-descriptions-item label="题目来源">{{ problemData?.source }}</t-descriptions-item>
            <t-descriptions-item v-if="problemData?.originUrl" label="原题链接">
              <t-link :href="problemData?.originUrl" target="_blank">
                {{ problemData?.originOj }} - {{ problemData?.originId }}
              </t-link>
            </t-descriptions-item>
            <t-descriptions-item label="标签" v-if="problemId">
              <t-space>
                <t-button v-for="tag in problemData?.tags" :key="tag.id" variant="dashed" @click="() => handleClickTag(tag)">
                  {{ tag.name }}
                </t-button>
              </t-space>
            </t-descriptions-item>
          </t-descriptions>

          <div class="dida-operation-container">
            <t-space>
              <t-button @click="handleClickJudgeStatus">提交记录</t-button>
              <t-button @click="handleClickDiscuss">题目讨论</t-button>
              <t-button @click="handleClickRecommend" v-if="problemId">题目推荐</t-button>
            </t-space>
          </div>
          <div class="dida-operation-container">
            <t-space>
              <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
              <t-button v-if="problemData?.originId" @click="handleClickCrawl" :loading="problemCrawlLoading">更新描述 </t-button>
            </t-space>
          </div>

          <div class="dida-code-submit-div">
            <t-space>
              <t-select v-model="selectLanguage" label="语言：" placeholder="请选择提交语言" auto-width clearable @change="onSelectLanguageChanged">
                <t-option v-for="item in languageOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
              </t-select>
              <t-button @click="handleSubmitCode">提交</t-button>
            </t-space>
            <div ref="codeEditRef" class="dida-code-editor"></div>
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

.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-operation-container {
  margin: 10px 0 20px;
  text-align: right;
}

.dida-code-submit-div {
  margin-top: 10px;
}

.dida-code-editor {
  margin-top: 10px;
  width: 100%;
  min-height: 500px;
}
</style>
