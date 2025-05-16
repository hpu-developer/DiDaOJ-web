// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Discuss, DiscussView, DiscussCreateRequest, DiscussComment, DiscussCommentView } from "@/types/discuss";
import Vditor from "vditor";

export function ParseDiscuss(item: Discuss): DiscussView {
  const result: DiscussView = {} as DiscussView;
  result.id = item.id;
  result.authorId = item.author_id;
  result.authorUsername = item.author_username;
  result.authorNickname = item.author_nickname;
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
  result.problemTitle = item.problem_title;
  result.contestId = item.contest_id;
  result.contestTitle = item.contest_title;
  result.contestProblemSort = item.contest_problem_sort;

  return result;
}

export async function ParseDiscussComment(item: DiscussComment): DiscussCommentView {
  const result = {} as DiscussCommentView;
  result.id = item.id;
  result.authorId = item.author_id;
  result.authorUsername = item.author_username;
  result.authorNickname = item.author_nickname;
  result.content = "";
  if (item.content) {
    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    result.content = await Vditor.md2html(item.content, options);
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

export function GetDiscuss(discussId: string) {
  return httpRequest({
    url: "/discuss" + "?id=" + discussId,
    method: "get",
  });
}

export function GetDiscussList(contestId: number, page: number, pageSize: number) {
  return httpRequest({
    url: "/discuss/list" + "?contest_id=" + contestId + "&page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetDiscussCommentList(discussId: number, page: number, pageSize: number) {
  return httpRequest({
    url: "/discuss/comment/list" + "?id=" + discussId + "&page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function PostCreateDiscuss(request: DiscussCreateRequest) {
  return httpRequest({
    url: "/discuss/create",
    method: "post",
    data: request,
  });
}
