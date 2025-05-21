<script setup lang="ts">
import { onMounted, ref } from "vue";

const showLoading = ref(false);
const hitokotoFrom = ref("");
const hitokotoContent = ref("");
const hitokotoCreator = ref("");

const requestHitokoto = async () => {
  showLoading.value = true;
  try {
    const response = await fetch("https://v1.hitokoto.cn");
    const data = await response.json();
    hitokotoContent.value = data.hitokoto;
    hitokotoCreator.value = data.creator;
    hitokotoFrom.value = "—— " + data.from;
  } catch (error) {
    hitokotoContent.value = "一言获取失败了，但至少您还可以访问本站。";
    hitokotoCreator.value = "BoilTask";
    hitokotoFrom.value = "DidaOJ";
    console.error("Error fetching Hitokoto:", error);
  } finally {
    showLoading.value = false;
  }
};

onMounted(() => {
  requestHitokoto();
});
</script>

<template>
  <t-loading :loading="showLoading">
    <t-card title="一言 © Hitokoto">
      <template #actions>
        @{{ hitokotoCreator }}
      </template>
      <div>
        <span>{{ hitokotoContent }}</span>
        <p style="text-align: right">{{ hitokotoFrom }}</p>
      </div>
    </t-card>
  </t-loading>
</template>

<style scoped></style>
