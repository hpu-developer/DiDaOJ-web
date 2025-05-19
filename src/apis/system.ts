// 导入axios实例
import httpRequest from "@/apis/axios-common";

export function GetWebNotification() {
  return httpRequest({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/system/notification.json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetJudgers() {
  return httpRequest({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/status/judger.json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetJudgerStatus(key: string) {
  return httpRequest({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/status/judger/" + key + ".json" + "?" + Date.now(),
    method: "get",
  });
}

export function GetWebStatus(key: string) {
  return httpRequest({
    baseURL: "https://r2-oj.didapipa.com",
    url: "/status/web.json" + "?" + Date.now(),
    method: "get",
  });
}
