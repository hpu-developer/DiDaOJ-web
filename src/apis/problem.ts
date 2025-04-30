// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Problem, ProblemTag, ProblemView } from "@/types/problem";

export enum ProblemAttemptStatus {
  None = 0,
  Attempt = 1,
  Accept = 2,
}

export function ParseProblem(item: Problem, tagsMap: { [key: number]: ProblemTag }): ProblemView {
  const result: ProblemView = {} as ProblemView;
  result.id = item.id;
  result.author = item.author;
  result.title = item.title;
  result.tags = [];
  if (item.tags) {
    for (const tag of item.tags) {
      const tagData = tagsMap[tag];
      if (tagData) {
        result.tags.push(tagData.name);
      }
    }
  }
  result.accept = item.accept;
  result.attempt = item.attempt;
  return result;
}

export function GetProblemTagList(num: number) {
  return httpRequest({
    url: "/problem/tag/list" + "?max_count=" + num,
    method: "get",
  });
}

export function GetProblemList(page: number, pageSize: number) {
  return httpRequest({
    url: "/problem/list" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}
