<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetUserInfo, ParseUser } from "@/apis/user.ts";
import { ShowErrorTips, ShowTextTipsError, useCurrentInstance } from "@/util";
import { UserInfoView } from "@/types/user.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

let username = "";

const userLoading = ref(false);
const userData = ref<UserInfoView | null>(null);

const problemsAc = ref([] as string[]);

onMounted(async () => {
  if (Array.isArray(route.params.username)) {
    username = route.params.username[0];
  } else {
    username = route.params.username;
  }
  if (!username) {
    await router.push({ name: "home" });
    return;
  }

  userLoading.value = true;
  try {
    let res = await GetUserInfo(username);

    if (res.code !== 0) {
      userLoading.value = false;
      ShowErrorTips(globalProperties, res.code);
      await router.push({ name: "home" });
      return;
    }

    userData.value = ParseUser(res.data.user);

    problemsAc.value = res.data.problems_ac;

    webStyleStore.setTitle(userData.value.nickname + " - " + webStyleStore.getTitle);
  } catch (e) {
    ShowTextTipsError(globalProperties, "获取用户信息失败");
    await router.push({ name: "home" });
  } finally {
    userLoading.value = false;
  }
});
</script>

<template>
  <t-loading :loading="userLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <t-card style="margin: 10px" title="AC题目">
          <t-space style="flex-wrap: wrap">
            <t-button
              v-for="problem in problemsAc"
              :key="problem"
              size="small"
              @click="() => router.push({ name: 'problem-detail', params: { problemId: problem } })"
            >
              {{ problem }}
            </t-button>
          </t-space>
        </t-card>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="昵称">{{ userData?.nickname }}</t-descriptions-item>
            <t-descriptions-item label="Slogan">{{ userData?.slogan }}</t-descriptions-item>
            <t-descriptions-item label="邮箱">{{ userData?.email }}</t-descriptions-item>
            <t-descriptions-item label="组织">{{ userData?.organization }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  min-height: 800px;
}
</style>
