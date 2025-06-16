// 导入axios实例
import httpRequest from "@/apis/axios-api";
import httpRequestCommon from "@/apis/axios-common";

export function GetWebNotification() {
  return httpRequestCommon({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/system/notification.json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetSystemStatus() {
  return httpRequest({
    url: "/system/status",
    method: "get",
  });
}

export function PostNotificationSave(theme: string, content: string) {
  return httpRequest({
    url: "/system/notification",
    method: "post",
    data: {
      theme: theme,
      content: content,
    },
  });
}
