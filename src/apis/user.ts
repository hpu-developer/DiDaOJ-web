import httpRequest from "@/apis/axios-api";

import md5 from "md5";

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
  if (item.email) {
    result.avatar = `https://www.gravatar.com/avatar/${md5(item.email.toLowerCase().trim())}?d=identicon&s=100`;
  }
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

export function PostUserRegisterEmailKey(token: string, email: string) {
  return httpRequest({
    url: "/user/register/email",
    method: "post",
    data: {
      token: token,
      email: email,
    },
  });
}

export function PostUserRegister(username: string, password: string, email: string, key: string, nickname: string) {
  return httpRequest({
    url: "/user/register",
    method: "post",
    data: {
      username: username,
      password: password,
      email: email,
      key: key,
      nickname: nickname,
    },
  });
}
