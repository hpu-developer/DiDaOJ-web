<script setup lang="ts">
import { PostLoginRefresh } from "@/apis/user.ts";
import { useLoginStore } from "@/stores/login";
import { useUserStore } from "@/stores/user.ts";
import { useWebStyleStore } from "@/stores/webStyle";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";
import { ref, onMounted } from "vue";

import HeaderContent from "./components/HeaderContent.vue";
import SidebarContent from "./components/SidebarContent.vue";
import BreadcrumbContent from "./components/BreadcrumbContent.vue";
import FooterContent from "./components/FooterContent.vue";
import ForceHiddenSidebarButton from "./components/ForceHiddenSidebarButton.vue";

import { ShowErrorTips, useCurrentInstance } from "@/util/index";

const { globalProperties } = useCurrentInstance();

const loginStore = useLoginStore();
const userStore = useUserStore();
const webStyleStore = useWebStyleStore();
const sidebarStyleStore = useSidebarStyleStore();

loginStore.$patch({
  Loaded: false,
});

const token = userStore.getToken;

const showSidebar = ref(false);
const realShowSidebar = ref(false);

const titleBase = "DidaOJ";

if (webStyleStore.title && webStyleStore.title.length > 0) {
  document.title = webStyleStore.title + " - " + titleBase;
} else {
  document.title = titleBase;
}

webStyleStore.$subscribe((_, state) => {
  if (state.title && state.title.length > 0) {
    document.title = state.title + " - " + titleBase;
  } else {
    document.title = titleBase;
  }
});

sidebarStyleStore.$subscribe((_, state) => {
  showSidebar.value = state.showSidebar;
  realShowSidebar.value = showSidebar.value && !state.forceHiddenSidebar;
});

function handleError() {
  globalProperties.$message.warning({
    duration: 3000,
    content: "登陆状态失效",
  });
  loginStore.$patch({
    Loaded: true,
  });
  userStore.clear();
}

onMounted(() => {
  if (token == "") {
    loginStore.$patch({
      Loaded: true,
    });
    return;
  }
  PostLoginRefresh()
    .then((res) => {
      if (res.code == 0) {
        userStore.loadResponse(res.data);
        loginStore.$patch({
          Loaded: true,
        });
      } else {
        ShowErrorTips(globalProperties, res.code);
        loginStore.$patch({
          Loaded: true,
        });
        userStore.clear();
      }
    })
    .catch((err) => {
      console.log(err);
      handleError();
    });

});
</script>

<template>
  <t-layout>
    <t-header class="sh-header">
      <HeaderContent />
    </t-header>
    <t-layout>
      <Transition name="slide">
        <t-aside v-if="realShowSidebar" class="sh-sidebar">
          <SidebarContent />
        </t-aside>
      </Transition>
      <t-layout :class="['sh-main-layout', { expanded: !realShowSidebar }]">
        <BreadcrumbContent />
        <t-content class="sh-main-content" v-copy-code>
          <RouterView />
        </t-content>
        <FooterContent />
      </t-layout>
    </t-layout>
  </t-layout>
  <ForceHiddenSidebarButton v-if="showSidebar" />
  <t-back-top container="body" :offset="['24px', '80px']" size="small"></t-back-top>
</template>

<style scoped>
.sh-header {
  padding: 0px;
  position: sticky;
  width: 100%;
  top: 0px;
  z-index: 1000;
  border-bottom: 1px solid #dcdee2;
}

.sh-sidebar {
  position: fixed;
  left: 0px;
  top: calc(56px + 1px);
  overflow: auto;
  z-index: 1000;
}

.sh-sidebar:after {
  content: "";
  display: block;
  width: 1px;
  height: 100%;
  background: #dcdee2;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 1;
}

.sh-main-layout {
  transition: margin-left 0.3s ease;
  margin-left: 232px;
  background: #fff;
}

.sh-main-layout.expanded {
  margin-left: 0;
}

.slide-enter-active {
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
}

.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.sh-main-content {
  min-width: 1100px;
}
</style>
