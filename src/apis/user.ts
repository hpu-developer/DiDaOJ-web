import httpRequest from "@/apis/axios-api";
import httpCommonRequest from "@/apis/axios-common";

import {
  UserInfo,
  UserInfoView,
  UserModifyInfoRequest,
  UserModifyPasswordRequest,
  UserModifyEmailRequest,
  UserModifyVjudgeRequest,
} from "@/types/user.ts";
import { GetAvatarUrl } from "@/util/avatar.ts";

export enum UserGender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export function GetUserGenderKey(gender: UserGender): string {
  switch (gender) {
    case UserGender.Male:
      return "male";
    case UserGender.Female:
      return "female";
    default:
      return "unkown";
  }
}

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
  result.vjudgeId = item.vjudge_id;
  result.avatar = GetAvatarUrl(item.username, item.email);
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

export function GetUserModifyInfo() {
  return httpRequest({
    url: `/user/modify/info`,
    method: "get",
  });
}

export function PostUserModifyInfo(request: UserModifyInfoRequest) {
  return httpRequest({
    url: "/user/modify",
    method: "post",
    data: request,
  });
}

export function PostUserModifyPassword(request: UserModifyPasswordRequest) {
  return httpRequest({
    url: "/user/modify/password",
    method: "post",
    data: request,
  });
}

export function PostUserModifyEmail(request: UserModifyEmailRequest) {
  return httpRequest({
    url: "/user/modify/email",
    method: "post",
    data: request,
  });
}

export function PostUserModifyVjudge(request: UserModifyVjudgeRequest) {
  return httpRequest({
    url: "/user/modify/vjudge",
    method: "post",
    data: request,
  });
}

export function PostUserModifyOldEmailKey(token: string) {
  return httpRequest({
    url: "/user/modify/email/key/old",
    method: "post",
    data: {
      token: token,
    },
  });
}

export function PostUserModifyEmailKey(token: string, email: string) {
  return httpRequest({
    url: "/user/modify/email/key",
    method: "post",
    data: {
      token: token,
      email: email,
    },
  });
}

export function GetVjudgeAcProblem(username: string) {
  const url = `https://vjudge.net/user/solveDetail/` + encodeURIComponent(username);
  return httpCommonRequest({
    url: url,
    method: "get",
  });
}

export function PostUserAccountInfoss(userIds: number[]) {
  return httpRequest({
    url: "/user/account/infos",
    method: "post",
    data: {
      users: userIds,
    },
  });
}

export function PostUserParse(usernames: string[]) {
  return httpRequest({
    url: "/user/parse",
    method: "post",
    data: {
      users: usernames,
    },
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

export function PostUserRegister(
  username: string,
  password: string,
  email: string,
  key: string,
  nickname: string,
  gender: string,
  realName: string,
  organization: string
) {
  return httpRequest({
    url: "/user/register",
    method: "post",
    data: {
      username: username,
      password: password,
      email: email,
      key: key,
      nickname: nickname,
      gender: gender,
      real_name: realName,
      organization: organization,
    },
  });
}

export function PostUserLoginForget(token: string, username: string) {
  return httpRequest({
    url: "/user/forget",
    method: "post",
    data: {
      token: token,
      username: username,
    },
  });
}

export function PostUserPasswordForget(username: string, password: string, key: string) {
  return httpRequest({
    url: "/user/password/forget",
    method: "post",
    data: {
      username: username,
      password: password,
      key: key,
    },
  });
}
