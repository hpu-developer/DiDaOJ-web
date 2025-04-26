<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";

import { IsMenuGroup, MenuList } from "@/types/webStyle";

const sidebarStyleStore = useSidebarStyleStore();

const showLoading = ref(false);
const menuPanel = ref(null as any);
const menuActiveName = ref<string>(sidebarStyleStore.menuActiveName);
const menuList = ref<MenuList>(sidebarStyleStore.menuList);

const animationQueue = ref<MenuList[]>([]);
const animationState = ref(false);

const updateMenu = () => {
  menuActiveName.value = sidebarStyleStore.menuActiveName;
  const oldMenuListString = JSON.stringify(menuList.value);
  const newMenuListString = JSON.stringify(sidebarStyleStore.menuList);
  if (oldMenuListString !== newMenuListString) {
    animationQueue.value.push([...sidebarStyleStore.menuList]);
    processQueue();
  }
};

const processQueue = async () => {
  if (animationQueue.value.length > 0 && !animationState.value) {
    animationState.value = true;
    while (animationQueue.value.length > 1) {
      animationQueue.value.shift();
    }
    const nextMenuList = animationQueue.value.shift() as MenuList;
    showLoading.value = nextMenuList.length <= 0;
    menuList.value = [];
    await nextTick();
    if (menuPanel.value) {
      menuPanel.value.updateActiveName();
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    menuList.value = nextMenuList;
    await nextTick();
    if (menuPanel.value) {
      menuPanel.value.updateActiveName();
    }
    const showTimeout = 300;
    await new Promise((resolve) => setTimeout(resolve, showTimeout));
    animationState.value = false;
    await processQueue();
  }
};

sidebarStyleStore.$subscribe((mutation, state) => {
  updateMenu();
});

onMounted(() => {
  updateMenu();
});
</script>

<template>
  <div id="menu-container">
    <t-menu v-model="menuActiveName" theme="light" class="sh-menu-container">
      <TransitionGroup name="move-left">
        <template v-for="(item, index) in menuList" :key="index">
          <!-- 使用类型守卫判断 item 是否为 MenuGroup -->
          <template v-if="IsMenuGroup(item)">
            <!-- 这是一个 MenuGroup -->
            <t-menu-group :title="item.title">
              <template v-for="(child, i) in item.children" :key="child.name">
                <t-menu-item :value="child.name" :to="child.to">
                  <template v-if="child.icon" #icon>
                    <t-icon :name="child.icon" :class="child.iconClass" />
                  </template>
                  {{ child.title }}
                </t-menu-item>
              </template>
            </t-menu-group>
          </template>

          <!-- 否则是 Menu 类型，直接渲染 t-menu-item -->
          <template v-else>
            <t-menu-item :key="item.name" :value="item.name" :to="item.to">
              <template v-if="item.icon" #icon>
                <t-icon :name="item.icon" :class="item.iconClass" />
              </template>
              {{ item.title }}
            </t-menu-item>
          </template>
        </template>
      </TransitionGroup>
    </t-menu>
  </div>
  <t-loading
    size="small"
    :loading="showLoading"
    :show-overlay="true"
    attach="#menu-container"
    class="sh-sidebar-loading"
    style="align-items: flex-start; padding-top: 100px"
  >
  </t-loading>
</template>

<style scoped>
.sh-menu-container {
  height: calc(100vh - 65px) !important;
}

.move-left-enter-active,
.move-left-leave-active {
  transition: transform 0.3s ease;
}

.move-left-enter-from,
.move-left-leave-to {
  transform: translateX(-100%);
}

.move-left-enter-to,
.move-left-leave-from {
  transform: translateX(0);
}
</style>
