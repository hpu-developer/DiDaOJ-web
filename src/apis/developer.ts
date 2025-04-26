import httpRequest from "@/apis/axios";
import { SilentType, SvnLockNotifyType } from "@/types/developer.ts";

export function getAppId() {
  return httpRequest({
    url: "/login/appid",
    method: "get",
  });
}

export function RequestLogin(code: string) {
  return httpRequest({
    url: "/login/login",
    method: "post",
    data: {
      code: code,
    },
  });
}

export function PostLoginRefresh() {
  return httpRequest({
    url: "/developer/login/refresh",
    method: "post",
  });
}

export interface DeveloperInfo {
  tapd: string;
  svn: string;
  git: string;
  svn_lock_notify_type: SvnLockNotifyType;
  svn_unlock_notify_type: SvnLockNotifyType;
  tapd_operate_silent: SilentType;
  tapd_listen_silent: SilentType;
  svn_operate_silent: SilentType;
  svn_listen_silent: SilentType;
}

export type DeveloperInfoResponse = DeveloperInfo;

export type DeveloperInfoSaveRequest = DeveloperInfo;

export function GetDeveloperInfo() {
  return httpRequest({
    url: "/developer/info",
    method: "get",
  });
}

export function SaveDeveloperConfig(config: DeveloperInfoSaveRequest) {
  return httpRequest({
    url: "/developer/info/save",
    method: "post",
    data: config,
  });
}
