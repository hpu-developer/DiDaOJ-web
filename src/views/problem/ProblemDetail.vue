<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetProblem } from "@/apis/problem.ts";
import { GetKeyByJudgeLanguage, GetSubmitLanguages, JudgeLanguage } from "@/apis/language.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { Problem } from "@/types/problem.ts";
import { PostJudgeJob } from "@/apis/judge.ts";

import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let content = ref("");
const problemId = ref("");
const markdownRef = ref<HTMLElement | null>(null);
const problemLoading = ref(false);
const problemData = ref<Problem | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;
const codeEditRef = ref<HTMLElement | null>(null);

const selectLanguage = ref("");
const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);

languageOptions.value = GetSubmitLanguages();

const handleSubmitCode = async () => {
  if (!problemId.value) {
    ShowTextTipsError(globalProperties, "问题ID无效");
    return;
  }
  if (!selectLanguage.value) {
    ShowTextTipsError(globalProperties, "请选择所编写的语言");
    return;
  }
  const code = codeEditor?.getValue();
  if (!code) {
    ShowTextTipsError(globalProperties, "请输入所需提交的代码");
    return;
  }
  const res = await PostJudgeJob(problemId.value, parseInt(selectLanguage.value), code);
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
  monaco.editor.setModelLanguage(codeEditor.getModel(), GetKeyByJudgeLanguage(value));
};

onMounted(async () => {
  if (route.params.problemId && route.params.problemId.length === 1) {
    problemId.value = route.params.problemId[0];
  } else {
    await router.push({ name: "problem" });
    return;
  }

  problemLoading.value = true;

  const res = await GetProblem(problemId.value);
  if (res.code !== 0) {
    problemLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem" });
    return;
  }

  problemData.value = res.data as Problem;

  let problemDescription = problemData.value.description as string;
  if (problemData.value.hint) {
    problemDescription += "\n\n" + problemData.value.hint;
  }

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

      if (codeEditRef.value) {
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
            <t-descriptions-item label="状态"></t-descriptions-item>
          </t-descriptions>
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

.dida-code-submit-div {
  margin-top: 10px;
}

.dida-code-editor {
  margin-top: 10px;
  width: 100%;
  min-height: 500px;
}
</style>
