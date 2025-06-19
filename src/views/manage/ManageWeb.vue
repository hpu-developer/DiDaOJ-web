<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { GetSystemImageToken, GetWebAnnouncement, GetWebNotification, PostAnnouncementSave, PostNotificationSave } from "@/apis/system.ts";
import { Notification, Announcement } from "@/types/system.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import Vditor from "vditor";
import { uploadR2Image } from "@/util/md-editor-v3.ts";

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
let announcementEditor = null as Vditor | null;

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
    if (!announcementEditor) {
      ShowErrorTips(globalProperties, "编辑器未初始化");
      return;
    }
    const content = announcementEditor.getValue();
    const res = await PostAnnouncementSave(announcement.value.title, content);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    announcementEditor.setValue(res.data.content);
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

  const codeEditOptions = {
    after: () => {
      announcementEditor?.setValue(announcement.value.content);
    },
    upload: {
      accept: "image/*,.mp3, .wav, .rar",
      filename(name) {
        return name
          .replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, "")
          .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, "")
          .replace("/\\s/g", "");
      },
      async handler(files: File[]) {
        return uploadR2Image(announcementEditor as Vditor, files, globalProperties, GetSystemImageToken);
      },
    },
    preview: {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    },
  } as IOptions;
  announcementEditor = new Vditor("problemEditDiv", codeEditOptions);
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
      <div id="problemEditDiv" class="dida-description-editor"></div>
    </t-card>
  </t-loading>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}

.dida-description-editor {
  margin: 20px;
  width: 100%;
  max-width: calc(100vw - 300px);
  min-height: 500px;
  z-index: 9999 !important;
}
</style>
