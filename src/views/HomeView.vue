<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Hitokoto from "@/components/Hitokoto.vue";
import { GetWebAnnouncement, GetWebNotification } from "@/apis/system.ts";
import type { Notification, Announcement } from "@/types/system.ts";
import { ShowTextTipsError, useCurrentInstance } from "@/util";
import Vditor from "vditor";

const { globalProperties } = useCurrentInstance();

let intervalId = -1;
const notification = ref<Notification>({
  theme: "",
  content: "",
});
const announcement = ref<Announcement>({
  title: "",
  content: "",
});
const stateLoading = ref(false);

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

const loadWebAnnouncement = async () => {
  try {
    const announcementRes = await GetWebAnnouncement();

    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    announcement.value.title = announcementRes.title;
    announcement.value.content = await Vditor.md2html(announcementRes.content, options);
  } catch (e) {
    ShowTextTipsError(globalProperties, "加载公告失败");
    announcement.value = {
      title: "公告加载失败",
      content: "请刷新页面重新获取",
    };
  }
};

onMounted(async () => {
  stateLoading.value = true;
  await handleReloadStatus();
  intervalId = setInterval(() => {
    handleReloadStatus();
  }, 30000);
  await loadWebAnnouncement();
  stateLoading.value = false;
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <t-loading :loading="stateLoading">
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

          <t-card :title="announcement?.title" style="width: 500px; margin: 0 auto">
            <div v-html="announcement?.content"></div>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <t-card style="margin: 10px" :bordered="true">
          <img src="https://api.jysafe.cn/ip/" alt="Welcome" style="width: 100%" />
        </t-card>
        <Hitokoto style="margin: 10px" />
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
  </t-loading>
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
