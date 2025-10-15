<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useLoginStore } from "@/stores/login";
import { useUserStore } from "@/stores/user.ts";
import { getGenerateTabs } from "@/config/tab-config";
import { useCurrentInstance } from "@/util";

const loginStore = useLoginStore();
const userStore = useUserStore();
const { globalProperties } = useCurrentInstance();

const isLoaded = ref(loginStore.isLoaded);

const isLogin = ref(false);

const username = ref(userStore.getUsername);
const nickname = ref(userStore.getNickname);

const tabList = ref();

const updateTabList = () => {
  tabList.value = getGenerateTabs(userStore);
};

loginStore.$subscribe((_, state) => {
  isLoaded.value = state.Loaded;
});

userStore.$subscribe((_, state) => {
  username.value = state.username;
  nickname.value = state.nickname;
  isLogin.value = state.token != "";

  updateTabList();
});

const handleClickLogin = () => {
  if (globalProperties.$router.currentRoute.value.name !== "login") {
    globalProperties.$router.push({
      name: "login",
      query: { redirect_uri: globalProperties.$router.currentRoute.value.fullPath },
    });
  }
};

const handleClickLogout = () => {
  userStore.clear();
  globalProperties.$message.success({
    duration: 3000,
    content: "注销成功",
  });
  globalProperties.$router.push({
    path: "/login",
    query: { redirect_uri: globalProperties.$router.currentRoute.value.fullPath },
  });
};

onMounted(() => {
  updateTabList();
});
</script>

<template>
  <t-head-menu v-model="$route.meta.tab" class="sh-menu" expand-type="popup">
    <template #logo>
      <router-link to="/" class="sh-logo">DidaOJ</router-link>
    </template>
    <template v-for="tab in tabList" :key="tab.name">
      <t-menu-item :value="tab.name" :to="{ name: tab.name }">
        <template #icon>
          <t-icon v-if="tab.icon" :name="tab.icon" />
        </template>
        {{ tab.title }}
      </t-menu-item>
    </template>
    <template #operations>
      <t-submenu v-if="isLoaded && isLogin" :title="nickname">
        <template #icon>
          <t-icon name="user" />
        </template>
        <t-menu-item value="user" :to="{ path: '/user/' + username }">个人空间</t-menu-item>
        <t-menu-item value="user_modify" :to="{ name: 'user-modify' }">修改信息</t-menu-item>
        <t-menu-item value="user_logout" @click="handleClickLogout"> 注销</t-menu-item>
      </t-submenu>
      <t-menu-item v-else-if="!isLoaded" value="login">
        <template #icon>
          <t-icon name="login" />
        </template>
        ...
      </t-menu-item>
      <t-menu-item v-else value="login" @click="handleClickLogin">
        <template #icon>
          <t-icon name="login" />
        </template>
        登录
      </t-menu-item>
    </template>
  </t-head-menu>
</template>

<style scoped>
.sh-menu {
}

.sh-logo {
  margin-left: 64px;
  margin-top: 8px;
  margin-right: 32px;
  color: inherit;
  text-decoration: none;
  font-size: 18px;
  font-weight: bold;
  font-family: "Source Code Pro", monospace;

  &:hover {
    color: #1890ff;
  }
}
</style>
