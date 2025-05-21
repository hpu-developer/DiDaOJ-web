<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import SystemStatus from "@/views/system/SystemStatus.vue";
import Hitokoto from "@/components/Hitokoto.vue";
import { GetWebNotification } from "@/apis/system.ts";
import { Notification } from "@/types/notification.ts";

let intervalId = -1;
const notification = ref<Notification | null>(null);

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

onMounted(async () => {
  await handleReloadStatus();
  intervalId = setInterval(() => {
    handleReloadStatus();
  }, 30000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <t-row>
    <t-col :span="8">
      <div class="sh-main">
        <t-alert v-if="notification" style="margin: 20px" :theme="notification.theme"> {{ notification.content }} </t-alert>

        <div class="dida-swiper-div">
          <t-swiper class="dida-swiper">
            <t-swiper-item>
              <img src="https://cdn.codeoj.cn/image/banner.jpg" class="swiper-img" />
            </t-swiper-item>
            <t-swiper-item>
              <img src="https://cdn.codeoj.cn/image/banner.jpg" class="swiper-img" />
            </t-swiper-item>
          </t-swiper>
        </div>

        <t-card title="正在完善，欢迎提供意见建议" style="width: 500px; margin: 0 auto">
          <p><a href="https://codeoj.cn/" target="_blank">CodeOJ</a>的迁移计划</p>
          <p>正在开发中</p>
        </t-card>
      </div>
    </t-col>
    <t-col :span="4">
      <Hitokoto style="margin: 10px" />

      <SystemStatus />
      <t-card style="margin: 10px" :bordered="true">
        <template #header>
          <b>友情链接</b>
        </template>
        <t-list>
          <t-list-item>
            <t-link href="https://boiltask.com" target="_blank">BoilTask Blog</t-link>
          </t-list-item>
        </t-list>
      </t-card>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-main {
  margin: 10px;
}

.dida-swiper-div {
  margin: 20px auto;
}

.swiper-img {
  width: 100%;
}
</style>
