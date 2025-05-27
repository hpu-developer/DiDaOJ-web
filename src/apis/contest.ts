// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Contest, ContestView, ContestCreateRequest, ContestDescription, ContestProblem } from "@/types/contest";
import Vditor from "vditor";

export function GetContestProblemIndexStr(index: number): string {
  let result = "";
  while (index > 0) {
    index--;
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26);
  }
  return result;
}

export async function ParseContest(item: Contest): Promise<ContestView> {
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
  if (item.problems) {
    // item.problems根据sort字段排序
    result.problems = [];
    item.problems.sort((a: ContestProblem, b: ContestProblem) => {
      return a.index - b.index;
    });
    for (let i = 0; i < item.problems.length; i++) {
      const problem = item.problems[i];
      if (!problem.accept) {
        problem.accept = 0;
      }
      if (!problem.attempt) {
        problem.attempt = 0;
      }
      problem.id = GetContestProblemIndexStr(problem.index);
      result.problems.push(problem);
    }
  }
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

export function GetContestRank(id: number) {
  return httpRequest({
    url: "/contest/rank" + "?id=" + id,
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
