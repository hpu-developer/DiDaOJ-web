<script setup lang="ts">
import { ref, onMounted } from "vue";

const now_time = ref("");

function updateTime() {
  now_time.value = new Date().toLocaleString();
}

onMounted(() => {
  updateTime();
  setInterval(() => {
    updateTime();
  }, 1000);
});
</script>

<template>
  <div class="footer">
    <div class="footer-left">
      <p class="foot-time">{{ now_time }}</p>
    </div>

    <div class="footer-center">
      <a href="https://beiancx.miit.gov.cn/" target="_blank">
        <t-button theme="default" variant="outline" :ghost="true">豫ICP备15024677号-4</t-button>
      </a>
    </div>

    <div class="footer-right">
      <p class="foot-text">
        <a href="https://github.com/hpu-developer/DiDaOJ-web" target="_blank">
          <t-button theme="default" variant="outline" :ghost="true">@didaoj-web</t-button>
        </a>
      </p>
      <p class="foot-text">
        <a href="https://github.com/hpu-developer/DiDaOJ-go" target="_blank">
          <t-button theme="default" variant="outline" :ghost="true">@didaoj-go</t-button>
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.footer {
  margin-top: 30px;
  display: flex;
  color: #ffffff;
  background-color: #000000;
  justify-content: space-between;
  padding-left: 24px;
  padding-right: 24px;
}

.foot-time {
  margin-top: 48px;
}

.foot-text {
  color: #ffffff;
  font-size: 18px;
  margin-left: 20px;
}

.foot-text_content {
  margin-top: 5px;
}

.footer-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
