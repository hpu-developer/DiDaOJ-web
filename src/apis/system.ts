// 导入axios实例
import httpRequest from "@/apis/axios-api";
import httpRequestCommon from "@/apis/axios-common";
import { UploadImageTokenResponse } from "@/util/md-editor-v3.ts";

export function GetWebNotification() {
  return httpRequestCommon({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/system/notification.json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetWebAnnouncement() {
  return httpRequestCommon({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/system/announcement.json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetSystemStatus() {
  return httpRequest({
    url: "/system/status",
    method: "get",
  });
}

export function GetSystemImageToken(): Promise<UploadImageTokenResponse> {
  return httpRequest({
    url: "/system/image/token",
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

export function PostAnnouncementSave(title: string, content: string) {
  return httpRequest({
    url: "/system/announcement",
    method: "post",
    data: {
      title: title,
      content: content,
    },
  });
}
