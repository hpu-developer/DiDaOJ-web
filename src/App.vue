<script setup lang="ts">
import { createApp, h, ref, onMounted, onUnmounted, computed } from "vue";
// @ts-ignore
import pangu from "pangu";
import { PostCheckin, PostLoginRefresh } from "@/apis/user.ts";
import { useLoginStore } from "@/stores/login";
import { useUserStore } from "@/stores/user.ts";
import { useWebStyleStore } from "@/stores/webStyle";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";
import { useFooterStyleStore } from "@/stores/footerStyle";
import { GetProblemAttemptStatusByKey, ProblemAttemptStatus } from "@/apis/problem.ts";
import { Button } from "tdesign-vue-next";

import HeaderContent from "./components/HeaderContent.vue";
import SidebarContent from "./components/SidebarContent.vue";
import BreadcrumbContent from "./components/BreadcrumbContent.vue";
import FooterContent from "./components/FooterContent.vue";
import ForceHiddenSidebarButton from "./components/ForceHiddenSidebarButton.vue";
import View403 from "@/views/View403.vue";

import { debounce, useCurrentInstance } from "@/util/";
import { ShowEnhancedAwardTips, ShowErrorTips, ShowTextTipsSuccess } from "@/util/tips.ts";
import { enableClickPositionTracking, disableClickPositionTracking } from "@/util/click-position";
import { useRoute } from "vue-router";
import { createFireworks as CreateFireworks } from "./util/fireworks";

const { globalProperties } = useCurrentInstance();

const loginStore = useLoginStore();
const userStore = useUserStore();
const webStyleStore = useWebStyleStore();
const sidebarStyleStore = useSidebarStyleStore();
const footerStyleStore = useFooterStyleStore();

loginStore.$patch({
  Loaded: false,
});

const token = userStore.getToken;

const showSidebar = ref(false);
const realShowSidebar = ref(false);
const showFooter = ref(true);
const realShowFooter = ref(true);

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

footerStyleStore.$subscribe((_, state) => {
  showFooter.value = state.showFooter;
  realShowFooter.value = showFooter.value && !state.forceHiddenFooter;
});

const route = useRoute();

const hasNotAuth = computed(() => {
  const auths = route.meta.auths as string[] | undefined;
  return auths ? !userStore.hasAllAuths(auths) : false;
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

const processProblemTags = async () => {
  const containers = document.querySelectorAll("oj-problem");
  if (containers.length === 0) {
    return;
  }
  let buttonThemes = {} as { [key: string]: any[] };
  containers.forEach((el) => {
    const key = el.getAttribute("key") as string;
    const mountNode = document.createElement("span");
    mountNode.setAttribute("style", "padding:5px");
    el.replaceWith(mountNode);
    const theme = ref("default");
    if (!buttonThemes[key]) {
      buttonThemes[key] = [];
    }
    buttonThemes[key].push(theme);
    let problemId = key;
    if (key && !key.includes("-")) {
      problemId = "DidaOJ-" + key;
    }
    const app = createApp({
      render: () =>
        h(Button, {
          innerHTML: problemId,
          onClick: () => {
            window.open(`/problem/${key}`, "_blank");
          },
          size: "small",
          variant: "outline",
          theme: theme.value as "default" | "primary" | "success" | "warning" | "danger" | undefined,
        }),
    });
    app.mount(mountNode);
  });
  const problemKeys = [];
  for (const key in buttonThemes) {
    problemKeys.push(key);
  }
  const res = await GetProblemAttemptStatusByKey(problemKeys);
  if (res.code === 0) {
    for (const id in buttonThemes) {
      const themes = buttonThemes[id];
      if (!themes) {
        continue;
      }
      let theme = "primary";
      const status = res.data[id];
      if (status) {
        switch (status) {
          case ProblemAttemptStatus.Accept:
            theme = "success";
            break;
          case ProblemAttemptStatus.Attempt:
            theme = "warning";
            break;
        }
      }
      for (const t of themes) {
        t.value = theme;
      }
    }
  }
};

const postCheckin = async () => {
  try {
    const res = await PostCheckin();
    if (res.code === 0) {
      ShowTextTipsSuccess(globalProperties, "每日签到成功！");
      CreateFireworks();
      ShowEnhancedAwardTips(globalProperties, res.data, 4000);
    }
  } catch (e) {
    console.log(e);
  }
};

onMounted(() => {
  // 启用全局点击位置跟踪
  enableClickPositionTracking();

  document.addEventListener("DOMContentLoaded", () => {
    // listen to any DOM change and automatically perform spacing via MutationObserver()

    const observer = new MutationObserver(() => {
      debounce(() => {
        processProblemTags();
      }, 1000)();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    pangu.autoSpacingPage();
  });

  if (token) {
    PostLoginRefresh()
      .then((res) => {
        if (res.code == 0) {
          userStore.loadResponse(res.data);
          loginStore.$patch({
            Loaded: true,
          });

          postCheckin();
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
  } else {
    loginStore.$patch({
      Loaded: true,
    });
  }
});

// 组件卸载时禁用点击位置跟踪
onUnmounted(() => {
  disableClickPositionTracking();
});
</script>

<template>
  <t-layout class="sh-app-layout">
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
        <t-content class="sh-main-content">
          <View403 v-if="hasNotAuth" />
          <RouterView v-else />
        </t-content>
        <FooterContent v-if="realShowFooter" />
      </t-layout>
    </t-layout>
  </t-layout>
  <ForceHiddenSidebarButton v-if="showSidebar" />
  <t-back-top container="body" :offset="['24px', '80px']" size="small"></t-back-top>
</template>

<style scoped>
.sh-app-layout {
  min-width: 1440px;
}

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
</style>
