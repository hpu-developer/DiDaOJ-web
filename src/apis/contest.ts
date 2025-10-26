// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Contest, ContestView, ContestEditRequest, ContestProblem } from "@/types/contest";
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

export function ParseContest(item: Contest) {
  const result: ContestView = {} as ContestView;
  result.id = item.id;

  result.title = item.title;
  result.startTime = new Date(item.start_time).toLocaleString();
  result.endTime = new Date(item.end_time).toLocaleString();
  result.submitAnytime = item.submit_anytime;
  result.private = item.private;

  result.inserter = item.inserter;
  result.inserterUsername = item.inserter_username;
  result.inserterNickname = item.inserter_nickname;
  result.insertTime = new Date(item.insert_time).toLocaleString();
  result.modifier = item.modifier;
  result.modifierUsername = item.modifier_username;
  result.modifierNickname = item.modifier_nickname;
  result.modifyTime = new Date(item.modify_time).toLocaleString();

  result.description = item.description;

  result.notification = item.notification;
  if (item.problems) {
    // item.problems根据sort字段排序
    result.problems = [];
    item.problems.sort((a: ContestProblem, b: ContestProblem) => {
      return a.index - b.index;
    });
    for (let i = 0; i < item.problems.length; i++) {
      const problem = item.problems[i];
      let problemView: ProblemView = { id: 0, accept: 0, attempt: 0, inserter: "", key: "", private: false, tags: [], title: "" };
      problemView.index = problem.index;
      problemView.key = GetContestProblemIndexStr(problem.index);
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

export function GetContest(contestId: number) {
  return httpRequest({
    url: "/contest" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestEdit(contestId: number) {
  return httpRequest({
    url: "/contest/edit" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestProblems(contestId: number) {
  return httpRequest({
    url: "/contest/problem/list" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestImageToken(contestId: number) {
  if (!contestId) {
    contestId = 0;
  }
  return httpRequest({
    url: "/contest/image/token" + "?id=" + contestId,
    method: "get",
  });
}

export function GetContestProblemRealKey(contestId: number, problemIndex: number) {
  return httpRequest({
    url: "/contest/problem" + "?id=" + contestId + "&problem_index=" + problemIndex,
    method: "get",
  });
}

export function GetContestList(title: string, username: string, page: number, pageSize: number) {
  const params: Record<string, string> = {};
  if (title) {
    params["title"] = title;
  }
  if (username) {
    params["username"] = username;
  }
  if (page) {
    params["page"] = String(page);
  }
  if (pageSize) {
    params["page_size"] = String(pageSize);
  }
  return httpRequest({
    url: "/contest/list" + `?${new URLSearchParams(params).toString()}`,
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

export function PostContestPassword(contestId: number, password: string) {
  return httpRequest({
    url: "/contest/password",
    method: "post",
    data: {
      id: contestId,
      password: password,
    },
  });
}

export function PostContestDolos(contestId: number) {
  return httpRequest({
    url: "/contest/dolos",
    method: "post",
    data: {
      id: contestId,
    },
  });
}
