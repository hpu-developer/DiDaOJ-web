<script setup lang="ts">
import { ref } from "vue";
import { useLoginStore } from "@/stores/login";
import { useDeveloperStore } from "@/stores/developer.ts";
import { getGenerateTabs } from "@/config/tab-config";

const loginStore = useLoginStore();

const isLoaded = ref(loginStore.isLoaded);

const developerStore = useDeveloperStore();

const isLogin = ref(false);

const name = ref(developerStore.getName);

const tabList = ref(getGenerateTabs());

loginStore.$subscribe((_, state) => {
  isLoaded.value = state.Loaded;
});

developerStore.$subscribe((_, state) => {
  name.value = state.name;
  isLogin.value = state.token != "";
});
</script>

<template>
  <t-head-menu v-model="$route.meta.tab" class="sh-menu">
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
      <t-menu-item v-if="isLoaded && isLogin" value="developer" :to="{ name: 'developer' }">
        <template #icon>
          <t-icon name="user" />
        </template>
        {{ name }}
      </t-menu-item>
      <t-menu-item v-else value="login" :to="{ name: 'login' }">
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
  min-width: 1300px;
}

.sh-logo {
  margin-left: 64px;
  margin-top: 8px;
  margin-right: 32px;
}
</style>
