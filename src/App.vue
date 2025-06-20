<script setup lang="ts">
import { createApp, h, ref, onMounted, computed } from "vue";
import pangu from "pangu";
import { PostLoginRefresh } from "@/apis/user.ts";
import { useLoginStore } from "@/stores/login";
import { useUserStore } from "@/stores/user.ts";
import { useWebStyleStore } from "@/stores/webStyle";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";
import { GetProblemAttemptStatus, ProblemAttemptStatus } from "@/apis/problem.ts";

import HeaderContent from "./components/HeaderContent.vue";
import SidebarContent from "./components/SidebarContent.vue";
import BreadcrumbContent from "./components/BreadcrumbContent.vue";
import FooterContent from "./components/FooterContent.vue";
import ForceHiddenSidebarButton from "./components/ForceHiddenSidebarButton.vue";
import View403 from "@/views/View403.vue";

import { debounce, ShowErrorTips, useCurrentInstance } from "@/util/";
import { useRoute } from "vue-router";

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
    const id = el.getAttribute("id");
    const mountNode = document.createElement("span");
    mountNode.setAttribute("style", "padding:5px");
    el.replaceWith(mountNode);
    const theme = ref("default");
    if (!buttonThemes[id]) {
      buttonThemes[id] = [];
    }
    buttonThemes[id].push(theme);
    let problemId = id;
    if (id && !id.includes("-")) {
      problemId = "DidaOJ-" + id;
    }
    const app = createApp({
      render: () =>
        h(TButton, {
          innerHTML: problemId,
          onClick: () => {
            window.open(`/problem/${id}`, "_blank");
          },
          size: "small",
          variant: "outline",
          theme: theme.value,
        }),
    });
    app.mount(mountNode);
  });
  const problemIds = [];
  for (const id in buttonThemes) {
    problemIds.push(id);
  }
  const res = await GetProblemAttemptStatus(problemIds);
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

onMounted(() => {
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
        <FooterContent />
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
