// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Contest, ContestView, ContestCreateRequest, ContestDescription } from "@/types/contest";
import Vditor from "vditor";

export async function ParseContest(item: Contest): ContestView {
  const result: ContestView = {} as ContestView;
  result.id = item.id;
  result.ownerId = item.owner_id;
  result.ownerUsername = item.owner_username;
  result.ownerNickname = item.owner_nickname;
  result.title = item.title;
  result.startTime = new Date(item.start_time).toLocaleString();
  result.endTime = new Date(item.end_time).toLocaleString();

  if (item.descriptions) {
    result.descriptions = [];
    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    for (let i = 0; i < item.descriptions.length; i++) {
      const description = item.descriptions[i];
      const contentDescription = {} as ContestDescription;
      contentDescription.title = description.title;
      contentDescription.content = await Vditor.md2html(description.content, options);
      contentDescription.sort = description.sort;
      result.descriptions.push(contentDescription);
    }
  }
  result.notification = item.notification;
  result.problems = item.problems;
  return result;
}

export function GetContest(contestId: string) {
  return httpRequest({
    url: "/contest" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestList(page: number, pageSize: number) {
  return httpRequest({
    url: "/contest/list" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function PostCreateContest(request: ContestCreateRequest) {
  return httpRequest({
    url: "/contest/create",
    method: "post",
    data: request,
  });
}
