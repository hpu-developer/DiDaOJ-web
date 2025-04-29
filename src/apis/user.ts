import httpRequest from "@/apis/axios-api";

export function RequestLogin(username: string, password: string) {
  return httpRequest({
    url: "/user/login",
    method: "post",
    data: {
      username: username,
      password: password,
    },
  });
}

export function PostLoginRefresh() {
  return httpRequest({
    url: "/user/login/refresh",
    method: "post",
  });
}

export interface UserInfo {
  tapd: string;
  svn: string;
  git: string;
}

export type UserInfoResponse = UserInfo;

export type UserInfoSaveRequest = UserInfo;

export function GetUserInfo() {
  return httpRequest({
    url: "/user/info",
    method: "get",
  });
}

export function SaveUserConfig(config: UserInfoSaveRequest) {
  return httpRequest({
    url: "/user/info/save",
    method: "post",
    data: config,
  });
}
