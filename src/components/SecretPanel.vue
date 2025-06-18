<script setup>
import { ref } from "vue";

const isOpen = ref(false);
</script>

<template>
  <div v-bind="$attrs">
    <div class="sh-button">
      <t-button @click="isOpen = !isOpen">
        {{ isOpen ? "收起" : "展开" }}
      </t-button>
    </div>
    <div v-show="isOpen" style="margin-top: 16px">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sh-button {
  text-align: center;
  margin: 16px;
}
</style>
