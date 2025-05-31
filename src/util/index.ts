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

export function GetCommonErrorCode() {
  return 1000;
}

export function ShowTextTipsSuccess(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  properties.$message.success({
    duration,
    content: tips,
  });
}

export function ShowTextTipsInfo(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  properties.$message.info({
    duration,
    content: tips,
  });
}

export function ShowTextTipsError(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  properties.$message.error({
    duration,
    content: tips,
  });
}

export function ShowErrorTips(properties: ComponentCustomProperties & Record<string, any>, tips: number | string, duration = 3000) {
  const [found, realTips] = GetText(tips);
  const message = found ? realTips : `系统错误，错误提示[${realTips}]`;

  properties.$message.error({
    duration,
    content: message,
  });
}

// 计算省略文本
export function GetEllipsisText(text: string, length: number) {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + "...";
}

export function formatDate(date) {
  date = new Date(date);
  const pad = (n) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 月份从0开始
  const day = pad(date.getDate());

  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
