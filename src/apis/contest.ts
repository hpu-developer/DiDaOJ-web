// 导入axios实例
import httpRequest from "@/apis/axios-api";

import { Contest, ContestCreateRequest, ContestView } from "@/types/contest";

export function ParseContest(item: Contest): ContestView {
  const result: ContestView = {} as ContestView;
  result.id = item.id;
  result.ownerId = item.owner_id;
  result.ownerUsername = item.owner_username;
  result.ownerNickname = item.owner_nickname;
  result.title = item.title;
  result.startTime = new Date(item.start_time).toLocaleString();
  result.endTime = new Date(item.end_time).toLocaleString();
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
