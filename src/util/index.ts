import { getCurrentInstance } from "vue";
import { GetText } from "@/text/library.ts";

import type { ComponentCustomProperties, ComponentInternalInstance } from "vue";

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

export function GetCommonErrorCode() {
  return 1000;
}

export function ShowTextTipsSuccess(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.success({
    duration,
    content: tips,
  });
}

export function ShowTextTipsInfo(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.info({
    duration,
    content: tips,
  });
}

export function ShowTextTipsError(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.error({
    duration,
    content: tips,
  });
}

export function ShowErrorTips(properties: ComponentCustomProperties & Record<string, any>, tips: number | string, duration = 3000) {
  const [found, realTips] = GetText(tips);
  const message = found ? realTips : `系统错误，错误提示[${realTips}]`;

  return properties.$message.error({
    duration,
    content: message,
  });
}

export function CloseTips(properties: ComponentCustomProperties & Record<string, any>, tip: any) {
  if (properties.$message) {
    properties.$message.close(tip);
  }
}

// 计算省略文本
export function GetEllipsisText(text: string, length: number) {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + "...";
}

export function formatDate(date: Date | string | number): string {
  date = new Date(date);
  const pad = (n: any) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 月份从0开始
  const day = pad(date.getDate());

  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function SplitIdStringsFromText(text: string): string[] {
  const problemSplits = text.trim().split(/\s+/); // 相当于 strings.Fields
  const problemList = problemSplits.flatMap((problem) => problem.split(","));
  return problemList.filter((item) => item.trim() !== "");
}

export function SplitIdNumbersFromText(text: string): number[] {
  return SplitIdStringsFromText(text)
    .filter((item) => !isNaN(Number(item)))
    .map((item) => Number(item));
}
