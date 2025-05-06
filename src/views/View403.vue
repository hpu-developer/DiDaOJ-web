<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

let router = useRoute();

const targetPath = ref("");

onMounted(() => {
  if (router.query.target) {
    targetPath.value = router.query.target as string;
  } else {
    targetPath.value = router.fullPath;
  }
});
</script>

<template>
  <div class="sh-main">
    <p>{{ targetPath }}</p>
    <p>该页面无访问权限，请更换访问目标或重新登陆后再试</p>
    <t-button theme="primary" @click="() => $router.push('/')">返回首页</t-button>
  </div>
</template>

<style scoped>
.sh-main {
  min-height: 400px;
  height: 75vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
