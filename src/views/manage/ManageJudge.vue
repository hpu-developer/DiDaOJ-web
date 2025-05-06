<script setup lang="tsx">
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostRejudgeRecently } from "@/apis/judge.ts";

const { globalProperties } = useCurrentInstance();

const handleRejudge = async () => {
  const res = await PostRejudgeRecently();
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }
  ShowTextTipsInfo(globalProperties, "重判成功");
};
</script>

<template>
  <t-card class="yj-manage-card" title="重判">
    <t-button @click="handleRejudge">重判</t-button>
  </t-card>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}
</style>
