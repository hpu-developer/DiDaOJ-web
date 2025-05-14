<script setup lang="tsx">
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostRejudgeRecently, PostRejudgeAll } from "@/apis/judge.ts";

const { globalProperties } = useCurrentInstance();

const handleRejudgeRecently = async () => {
  const res = await PostRejudgeRecently();
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }
  ShowTextTipsInfo(globalProperties, "重判成功");
};

const handleRejudgeAll = async () => {
  const res = await PostRejudgeAll();
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }
  ShowTextTipsInfo(globalProperties, "重判成功");
};
</script>

<template>
  <t-card class="yj-manage-card" title="重判最近提交">
    <t-button @click="handleRejudgeRecently">重判</t-button>
  </t-card>
  <t-card class="yj-manage-card" title="重判所有">
    <t-button @click="handleRejudgeAll" theme="danger">重判</t-button>
  </t-card>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}
</style>
