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
