import httpRequest from "@/apis/axios-api";

import type { UserInfo, UserInfoView } from "@/types/user.ts";

export function ParseUser(item: UserInfo): UserInfoView {
  const result: any = {};
  result.id = item.id;
  result.username = item.username;
  result.nickname = item.nickname;
  result.email = item.email;
  result.slogan = item.slogan;
  result.organization = item.organization;
  result.accept = item.accept;
  result.attempt = item.attempt;
  return result;
}

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

export function GetUserInfo(username: string) {
  const params = {
    username: username,
  };
  return httpRequest({
    url: `/user/info?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}
