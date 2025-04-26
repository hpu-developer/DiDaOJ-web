<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";

let router = useRoute();
let path = ref(router.fullPath);
</script>

<template>
  <div class="sh-main">
    <p>{{ path }}</p>
    <p>该页面无效或已被迁移，请重新选择访问目标</p>
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
