<script setup lang="tsx">
import { ref } from "vue";
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostRejudgeRecently, PostRejudgeSearch, PostRejudgeAll, JudgeStatus, GetJudgeStatusOptions, PostRejudgeStatus } from "@/apis/judge.ts";
import router from "@/router";
import { GetSubmitLanguages, JudgeLanguage } from "@/apis/language.ts";

const { globalProperties } = useCurrentInstance();

const rejudgeRecentlyLoading = ref(false);
const rejudgeAllLoading = ref(false);

const searchForm = ref({
  problemId: "",
  language: undefined as JudgeLanguage | undefined,
  status: undefined as JudgeStatus | undefined,
});

const rejudgeSearchLoading = ref(false);

const languageOptions = ref([] as { label: string; value: JudgeLanguage }[]);
languageOptions.value = GetSubmitLanguages();
const judgeStatusOptions = ref([] as { label: string; value: JudgeStatus }[]);
judgeStatusOptions.value = GetJudgeStatusOptions();

const handleRejudgeRecently = async () => {
  rejudgeRecentlyLoading.value = true;
  try {
    const res = await PostRejudgeRecently();
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "重判成功");
    await router.push({ name: "judge-list" });
  } catch (e) {
    console.error(e);
    ShowErrorTips(globalProperties, "重判失败");
  } finally {
    rejudgeRecentlyLoading.value = false;
  }
};

const handleRejudgeSearch = async () => {
  if (!searchForm.value.problemId && !searchForm.value.language && !searchForm.value.status) {
    ShowErrorTips(globalProperties, "请输入问题Id");
    return;
  }
  rejudgeSearchLoading.value = true;
  try {
    const res = await PostRejudgeSearch(searchForm.value.problemId, searchForm.value.language, searchForm.value.status);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "重判成功");
    await router.push({
      name: "judge-list",
      query: {
        problem_id: searchForm.value.problemId,
        language: searchForm.value.language,
      },
    });
  } catch (e) {
    console.error(e);
    ShowErrorTips(globalProperties, "重判失败");
  } finally {
    rejudgeSearchLoading.value = false;
  }
};

const handleRejudgeAll = async () => {
  rejudgeAllLoading.value = true;
  try {
    const res = await PostRejudgeAll();
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "重判成功");
    await router.push({ name: "judge-list" });
  } catch (e) {
    console.error(e);
    ShowErrorTips(globalProperties, "重判失败");
  } finally {
    rejudgeAllLoading.value = false;
  }
};
</script>

<template>
  <t-card class="yj-manage-card" title="重判指定记录">
    <t-form layout="inline" @submit="handleRejudgeSearch">
      <t-form-item label="题号">
        <t-input v-model="searchForm.problemId" placeholder="请输入描述" />
      </t-form-item>
      <t-form-item>
        <t-space>
          <t-button theme="primary" type="submit" :loading="rejudgeSearchLoading">重判</t-button>
        </t-space>
      </t-form-item>
    </t-form>
  </t-card>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}
</style>
