// 导入axios实例
import httpRequest from "@/apis/axios-api";

import { GetJudgeTypeStr } from "@/apis/judge.ts";

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
        result.tags.push(tagData);
      }
    }
  }
  result.accept = item.accept;
  result.attempt = item.attempt;

  if (item.description != undefined) {
    result.description = item.description;
  }
  if (item.time_limit != undefined) {
    result.timeLimit = item.time_limit.toString() + " ms";
  }
  if (item.memory_limit != undefined) {
    result.memoryLimit = (item.memory_limit / 1024).toFixed(2) + " MB";
  }
  if (item.judge_type != undefined) {
    result.judgeType = GetJudgeTypeStr(item.judge_type);
  }
  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  if (item.update_time != undefined) {
    result.updateTime = new Date(item.update_time).toLocaleString();
  }
  if (item.creator_nickname != undefined) {
    result.creatorNickname = item.creator_nickname;
  }
  if (item.source != undefined) {
    result.source = item.source;
  }
  if (item.judge_md5 != undefined) {
    result.judgeMd5 = item.judge_md5;
  }

  return result;
}

export function GetProblem(problemId: string, contestId: number, problemIndex: number) {
  const params = {} as any;
  if (problemId) {
    params.id = problemId;
  } else {
    params.contest_id = contestId;
    params.problem_index = problemIndex;
  }
  return httpRequest({
    url: `/problem?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetProblemTagList(num: number) {
  return httpRequest({
    url: "/problem/tag/list" + "?max_count=" + num,
    method: "get",
  });
}

export function GetProblemJudge(problemId: string) {
  return httpRequest({
    url: "/problem/judge" + "?id=" + problemId,
    method: "get",
  });
}

export function GetProblemList(title: string, tag: string, page: number, pageSize: number) {
  const params = {} as any;
  if (title) {
    params.title = title;
  }
  if (tag) {
    params.tag = tag;
  }
  if (page) {
    params.page = page;
  }
  if (pageSize) {
    params.page_size = pageSize;
  }

  return httpRequest({
    url: `/problem/list?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetProblemRecommend(problemId:string ) {
  const params = {} as any;
  if (problemId) {
    params.problem_id = problemId;
  }
  return httpRequest({
    url: `/problem/recommend?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function PostProblemEdit(
  problemId: string,
  title: string,
  timeLimit: number,
  memoryLimit: number,
  source: string,
  tags: string[],
  description: string
) {
  return httpRequest({
    url: "/problem/edit",
    method: "post",
    data: {
      id: problemId,
      title: title,
      time_limit: timeLimit,
      memory_limit: memoryLimit,
      source: source,
      tags: tags,
      description: description,
    },
  });
}

export function GetJudgeDataDownload(id: string, key: string) {
  return httpRequest({
    url: "/problem/judge/data/download" + "?id=" + id + "&key=" + key,
    method: "get",
  });
}

export function PostJudgeData(id: string, zip: File) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("zip", zip);
  return httpRequest({
    url: "/problem/judge/data",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 1000 * 60 * 5, // 设置超时时间为5分钟
  });
}
