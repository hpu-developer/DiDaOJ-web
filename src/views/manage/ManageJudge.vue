<script setup lang="tsx">
import { ref } from "vue";
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostRejudgeRecently, PostRejudgeProblem, PostRejudgeAll } from "@/apis/judge.ts";
import router from "@/router";

const { globalProperties } = useCurrentInstance();

const rejudgeProblemId = ref("");
const rejudgeProblemLoading = ref(false);
const rejudgeAllLoading = ref(false);

const handleRejudgeRecently = async () => {
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
  }
};

const handleRejudgeProblem = async () => {
  if (rejudgeProblemId.value === "") {
    ShowErrorTips(globalProperties, "请输入问题Id");
    return;
  }
  rejudgeProblemLoading.value = true;
  try {
    const res = await PostRejudgeProblem(rejudgeProblemId.value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "重判成功");
    await router.push({
      name: "judge-list",
      query: {
        problem_id: rejudgeProblemId.value,
      },
    });
  } catch (e) {
    console.error(e);
    ShowErrorTips(globalProperties, "重判失败");
  } finally {
    rejudgeProblemLoading.value = false;
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
  <t-card class="yj-manage-card" title="重判最近提交">
    <t-button @click="handleRejudgeRecently">重判</t-button>
  </t-card>
  <t-card class="yj-manage-card" title="重判问题">
    <t-space>
      <t-input v-model="rejudgeProblemId" placeholder="输入问题Id"></t-input>
      <t-button @click="handleRejudgeProblem" :loading="rejudgeProblemLoading">重判</t-button>
    </t-space>
  </t-card>
  <t-card class="yj-manage-card" title="重判所有">
    <t-button @click="handleRejudgeAll" theme="danger" :loading="rejudgeAllLoading">重判</t-button>
  </t-card>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}
</style>
