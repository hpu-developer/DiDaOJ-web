import { getCurrentInstance } from "vue";

import type { ComponentInternalInstance } from "vue";

export function useCurrentInstance() {
  const { appContext } = getCurrentInstance() as ComponentInternalInstance;
  const globalProperties = appContext.config.globalProperties;
  return {
    globalProperties,
  };
}

export function debounce(fn: (...args: any[]) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null;

  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
