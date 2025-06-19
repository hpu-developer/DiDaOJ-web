<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { GetWebAnnouncement, GetWebNotification, PostAnnouncementSave, PostNotificationSave } from "@/apis/system.ts";
import { GetSystemImageToken } from "@/apis/system.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { HandleR2ImageUpload } from "@/util/md-editor-v3.ts";
import type { UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";
import type { Notification, Announcement } from "@/types/system.ts";

const { globalProperties } = useCurrentInstance();

const notification = ref<Notification>({
  theme: "",
  content: "",
});

const announcement = ref<Announcement>({
  title: "",
  content: "",
});

const stateLoading = ref(false);
const notificationSaving = ref(false);

const announcementSaving = ref(false);

async function handleUploadImg(files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) {
  announcementSaving.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, GetSystemImageToken);
  announcementSaving.value = false;
}

const handleSaveNotification = async () => {
  notificationSaving.value = true;
  try {
    const res = await PostNotificationSave(notification.value.theme, notification.value.content);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "保存成功");
  } catch (e) {
    console.error(e);
    ShowErrorTips(globalProperties, "保存失败");
  } finally {
    notificationSaving.value = false;
  }
};

const handleSaveAnnouncement = async () => {
  announcementSaving.value = true;
  try {
    const content = announcement.value.content;
    const res = await PostAnnouncementSave(announcement.value.title, content);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    announcement.value.content = res.data.content;
    ShowTextTipsInfo(globalProperties, "保存成功");
  } catch (e) {
    console.error(e);
    ShowTextTipsError(globalProperties, "保存失败");
  } finally {
    announcementSaving.value = false;
  }
};

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

const loadWebAnnouncement = async () => {
  try {
    announcement.value = await GetWebAnnouncement();
  } catch (e) {
    ShowTextTipsError(globalProperties, "加载公告失败");
    announcement.value = {
      title: "",
      content: "",
    };
  }
};

onMounted(async () => {
  stateLoading.value = true;
  try {
    await handleReloadStatus();
    await loadWebAnnouncement();
  } catch (e) {
    ShowTextTipsError(globalProperties, "加载数据失败");
  }
  stateLoading.value = false;
});
</script>

<template>
  <t-loading :loading="stateLoading">
    <t-card class="yj-manage-card" title="站点通知">
      <t-form @submit="handleSaveNotification">
        <t-form-item label="主题">
          <t-select
            v-model="notification.theme"
            :options="[
              { label: 'success', value: 'success' },
              { label: 'info', value: 'info' },
              { label: 'warning', value: 'warning' },
              { label: 'error', value: 'error' },
            ]"
            placeholder="请选择主题"
          />
        </t-form-item>
        <t-form-item label="内容">
          <t-input v-model="notification.content" placeholder="请输入描述" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit" :loading="notificationSaving">保存</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <t-card class="yj-manage-card" title="首页公告">
      <template #actions>
        <t-button theme="primary" :loading="announcementSaving" @click="handleSaveAnnouncement">保存</t-button>
      </template>
      <t-form @submit="handleSaveAnnouncement">
        <t-form-item label="标题">
          <t-input v-model="announcement.title" placeholder="请输入描述" />
        </t-form-item>
      </t-form>
      <t-loading :loading="announcementSaving">
        <md-editor-v3
          v-model="announcement.content"
          @save="handleSaveAnnouncement"
          @onUploadImg="handleUploadImg"
          previewTheme="cyanosis"
          class="dida-description-editor"
        ></md-editor-v3>
      </t-loading>
    </t-card>
  </t-loading>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}

.dida-description-editor {
  margin: 10px;
  width: 100%;
}
</style>
