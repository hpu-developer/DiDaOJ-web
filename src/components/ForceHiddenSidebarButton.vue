<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";
let sidebarStyleStore = useSidebarStyleStore();

const margin = 20; // 间距
const buttonWidth = 100;
const buttonHeight = 50;

const position = ref({
  x: window.innerWidth - buttonWidth - margin,
  y: window.innerHeight - buttonHeight - margin,
});
const viewportWidth = ref(window.innerWidth);
const viewportHeight = ref(window.innerHeight);
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging = true;
  const clientX = (event as MouseEvent).clientX ?? (event as TouchEvent).touches[0].clientX;
  const clientY = (event as MouseEvent).clientY ?? (event as TouchEvent).touches[0].clientY;
  dragOffset = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  };

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("touchmove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchend", stopDrag);
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging) return;
  const clientX = (event as MouseEvent).clientX ?? (event as TouchEvent).touches[0].clientX;
  const clientY = (event as MouseEvent).clientY ?? (event as TouchEvent).touches[0].clientY;

  let newX = clientX - dragOffset.x;
  let newY = clientY - dragOffset.y;

  // Constrain within viewport
  newX = Math.max(0, Math.min(newX, viewportWidth.value - buttonWidth));
  newY = Math.max(0, Math.min(newY, viewportHeight.value - buttonHeight));

  position.value = { x: newX, y: newY };
};

const stopDrag = () => {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchend", stopDrag);
};

const onResize = () => {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  // Update position to maintain the margin
  position.value = {
    x: Math.min(position.value.x, viewportWidth.value - buttonWidth - margin),
    y: Math.min(position.value.y, viewportHeight.value - buttonHeight - margin),
  };
};

let forceHiddenSidebar = ref(sidebarStyleStore.forceHiddenSidebar);
let buttonShow = ref(sidebarStyleStore.forceHiddenSidebar);

const onClick = () => {
  forceHiddenSidebar.value = !forceHiddenSidebar.value;
  sidebarStyleStore.setForceHiddenSidebar(forceHiddenSidebar.value);
};

const onShow = () => {
  if (buttonShow.value) {
    return;
  }
  buttonShow.value = true;
  sidebarStyleStore.setForceHiddenSidebar(forceHiddenSidebar.value);
};

const onHide = () => {
  if (!buttonShow.value) {
    return;
  }
  buttonShow.value = false;
  sidebarStyleStore.setForceHiddenSidebar(false);
};

const updateButtonShow = (width: number) => {
  if (width >= 800) {
    onHide();
  } else {
    onShow();
  }
};

updateButtonShow(viewportWidth.value);
watch(viewportWidth, (newWidth) => {
  updateButtonShow(newWidth);
});

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <t-button
    class="draggable-button"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
    @touchstart="startDrag"
    variant="dashed"
    theme="primary"
    @click="onClick"
    v-if="buttonShow"
  >
    {{ forceHiddenSidebar ? "显示" : "隐藏" }}
  </t-button>
</template>

<style scoped>
.draggable-button {
  position: fixed; /* Changed to fixed */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  developer-select: none;
  touch-action: none;
  z-index: 2000;
}
</style>
