// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Contest, ContestView, ContestEditRequest, ContestProblem } from "@/types/contest";
import Vditor from "vditor";
import { ProblemView } from "@/types/problem.ts";

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
  result.createTime = new Date(item.create_time).toLocaleString();
  result.updateTime = new Date(item.update_time).toLocaleString();

  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
  } as IPreviewOptions;

  result.description = await Vditor.md2html(item.description, options);

  result.notification = item.notification;
  if (item.problems) {
    // item.problems根据sort字段排序
    result.problems = [];
    item.problems.sort((a: ContestProblem, b: ContestProblem) => {
      return a.index - b.index;
    });
    for (let i = 0; i < item.problems.length; i++) {
      const problem = item.problems[i];
      let problemView: ProblemView = { accept: 0, attempt: 0, author: "", id: "", private: false, tags: [], title: "" };
      problemView.index = problem.index;
      problemView.id = GetContestProblemIndexStr(problem.index);
      problemView.title = problem.title;
      if (problem.accept) {
        problemView.accept = problem.accept;
      } else {
        problemView.accept = 0;
      }
      if (problem.attempt) {
        problemView.attempt = problem.attempt;
      } else {
        problemView.attempt = 0;
      }
      result.problems.push(problemView);
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

export function GetContestEdit(contestId: string) {
  return httpRequest({
    url: "/contest/edit" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestProblemRealId(contestId: number, problemIndex: number) {
  return httpRequest({
    url: "/contest/problem" + "?id=" + contestId + "&problem_index=" + problemIndex,
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

export function PostContestCreate(request: ContestEditRequest) {
  return httpRequest({
    url: "/contest/create",
    method: "post",
    data: request,
  });
}

export function PostContestEdit(request: ContestEditRequest) {
  return httpRequest({
    url: "/contest/edit",
    method: "post",
    data: request,
  });
}
