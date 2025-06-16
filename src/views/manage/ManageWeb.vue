<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { GetWebNotification, PostNotificationSave } from "@/apis/system.ts";
import { Notification } from "@/types/notification.ts";
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";

const { globalProperties } = useCurrentInstance();

const notification = ref<Notification>({
  theme: "",
  content: "",
});

const stateLoading = ref(false);
const notificationSaving = ref(false);

const handleSaveNotification = async (e: Event) => {
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

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

onMounted(async () => {
  stateLoading.value = true;
  await handleReloadStatus();
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
  </t-loading>
</template>

<style scoped>
.yj-manage-card {
  margin: 20px;
}
</style>
