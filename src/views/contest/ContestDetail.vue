<script setup lang="tsx">
import { ref, onMounted, nextTick } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetContest, ParseContest } from "@/apis/contest.ts";
import { GetKeyByJudgeLanguage, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { Contest, ContestView } from "@/types/contest.ts";

import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let content = ref("");
const contestId = ref("");
const markdownRef = ref<HTMLElement | null>(null);
const contestLoading = ref(false);
const contestData = ref<ContestView | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;
const codeEditRef = ref<HTMLElement | null>(null);

const selectLanguage = ref("");
const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);

languageOptions.value = GetSubmitLanguages();

onMounted(async () => {
  if (route.params.contestId && route.params.contestId.length === 1) {
    contestId.value = route.params.contestId[0];
  } else {
    await router.push({ name: "contest" });
    return;
  }

  contestLoading.value = true;

  const res = await GetContest(contestId.value);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
    return;
  }

  contestData.value = ParseContest(res.data);

  let contestDescription = contestData.value.description as string;

  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
  } as IPreviewOptions;
  content.value = await Vditor.md2html(contestDescription, options);
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
    contestLoading.value = false;
  });
});
</script>

<template>
  <t-loading :loading="contestLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <h1>{{ contestData?.title }}</h1>
        <t-alert v-if="contestData?.notification" theme="info" :message="contestData?.notification" />
        <t-collapse :default-value="[0]" :expand-icon="false" :borderless="true">
          <t-collapse-panel :header="contestData?.title" v-for="(description, index) in contestData?.descriptions" :key="index">
            <template #headerRightContent v-if="index === 0">
              <t-space size="small">
                <t-button size="small">收起全部</t-button>
                <t-button size="small">展开全部</t-button>
              </t-space>
            </template>
            <div v-html="description.content" ref="markdownRef"></div>
          </t-collapse-panel>
        </t-collapse>

        <t-card style="margin: 10px">
          <t-table
            :data="problemViews"
            :columns="ListColumns"
            row-key="id"
            vertical-align="top"
            :hover="true"
            :pagination="pagination"
            :loading="dataLoading"
            @page-change="onPageChange"
          />
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="开始时间">{{ contestData?.startTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
