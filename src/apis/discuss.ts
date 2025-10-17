// 导入axios实例
import httpRequest from "@/apis/axios-api";

import { Discuss, DiscussView, DiscussEditRequest, DiscussComment, DiscussCommentView, DiscussCommentEditRequest } from "@/types/discuss";
import { GetAvatarUrl } from "@/util/avatar.ts";

export function ParseDiscuss(item: Discuss): DiscussView {
  const result: DiscussView = {} as DiscussView;
  result.id = item.id;
  result.inserter = item.inserter;
  result.inserterUsername = item.inserter_username;
  result.inserterNickname = item.inserter_nickname;
  result.inserterEmail = item.inserter_email;
  if (result.inserterEmail) {
    result.avatarUrl = GetAvatarUrl(result.inserterEmail);
  } else {
    result.avatarUrl = GetAvatarUrl(result.inserterUsername + "@avatar.com");
  }
  result.title = item.title;
  result.content = item.content;
  if (item.insert_time) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  if (item.modify_time) {
    result.modifyTime = new Date(item.modify_time).toLocaleString();
  }
  if (item.update_time) {
    result.updateTime = new Date(item.update_time).toLocaleString();
  }

  result.problemId = item.problem_id;
  result.problemKey = item.problem_key;
  result.problemTitle = item.problem_title;
  result.contestId = item.contest_id;
  result.contestTitle = item.contest_title;
  result.contestProblemIndex = item.contest_problem_index;

  return result;
}

export function ParseDiscussComment(item: DiscussComment): DiscussCommentView {
  const result = {} as DiscussCommentView;
  result.id = item.id;
  result.inserter = item.inserter;
  result.inserterUsername = item.inserter_username;
  result.inserterNickname = item.inserter_nickname;
  result.inserterEmail = item.inserter_email;
  if (result.inserterEmail) {
    result.avatarUrl = GetAvatarUrl(result.inserterEmail);
  } else {
    result.avatarUrl = GetAvatarUrl(result.inserterUsername + "@avatar.com");
  }
  result.content = "";
  if (item.content) {
    result.content = item.content;
  }
  if (item.insert_time) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  if (item.modify_time) {
    result.modifyTime = new Date(item.modify_time).toLocaleString();
  }
  if (item.update_time) {
    result.updateTime = new Date(item.update_time).toLocaleString();
  }
  return result;
}

export function GetDiscuss(discussId: number) {
  return httpRequest({
    url: "/discuss" + "?id=" + discussId,
    method: "get",
  });
}

export function GetDiscussEdit(discussId: number) {
  return httpRequest({
    url: "/discuss/edit" + "?id=" + discussId,
    method: "get",
  });
}

export function GetDiscussList(
  onlyProblemDiscuss: boolean,
  contestId: number,
  problemId: string,
  title: string,
  username: string,
  page: number,
  pageSize: number
) {
  const params = {} as any;
  if (onlyProblemDiscuss) {
    params.only_problem = "1";
  } else {
    params.only_problem = "0";
  }
  if (contestId) {
    params.contest_id = contestId;
  }
  if (problemId) {
    params.problem_id = problemId;
  }
  if (title) {
    params.title = title;
  }
  if (username) {
    params.username = username;
  }
  if (page) {
    params.page = page;
  }
  if (pageSize) {
    params.page_size = pageSize;
  }
  return httpRequest({
    url: `/discuss/list?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetDiscussImageToken(discussId: number) {
  if (!discussId) {
    discussId = 0;
  }
  return httpRequest({
    url: "/discuss/image/token" + "?id=" + discussId,
    method: "get",
  });
}

export function GetDiscussCommentImageToken(discussId: number, commentId: number) {
  if (!discussId) {
    discussId = 0;
  }
  if (!commentId) {
    commentId = 0;
  }
  return httpRequest({
    url: "/discuss/comment/image/token" + "?id=" + discussId + "&comment_id=" + commentId,
    method: "get",
  });
}

export function GetDiscussCommentList(discussId: number, page: number, pageSize: number) {
  return httpRequest({
    url: "/discuss/comment/list" + "?id=" + discussId + "&page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function PostDiscussCreate(request: DiscussEditRequest) {
  return httpRequest({
    url: "/discuss/create",
    method: "post",
    data: request,
  });
}

export function PostDiscussEdit(request: DiscussEditRequest) {
  return httpRequest({
    url: "/discuss/edit",
    method: "post",
    data: request,
  });
}

export function PostDiscussCommentCreate(request: DiscussCommentEditRequest) {
  return httpRequest({
    url: "/discuss/comment/create",
    method: "post",
    data: request,
  });
}

export function PostDiscussCommentEdit(request: DiscussCommentEditRequest) {
  return httpRequest({
    url: "/discuss/comment/edit",
    method: "post",
    data: request,
  });
}
