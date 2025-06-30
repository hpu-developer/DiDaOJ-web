// 导入axios实例
import httpRequest from "@/apis/axios-api";

import { GetJudgeTypeStr } from "@/apis/judge.ts";

import type { Problem, ProblemDaily, ProblemDailyView, ProblemTag, ProblemView } from "@/types/problem";
import { UploadImageTokenResponse } from "@/util/md-editor-v3.ts";

export enum ProblemAttemptStatus {
  None = 0,
  Attempt = 1,
  Accept = 2,
}

export function ParseProblem(item: Problem, tagsMap: { [key: number]: ProblemTag }): ProblemView {
  const result: ProblemView = {} as ProblemView;
  result.id = item.id;
  result.inserter = item.inserter;
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
  result.private = item.private;
  result.accept = item.accept;
  result.attempt = item.attempt;

  if (item.description != undefined) {
    result.description = item.description;
  }
  if (item.time_limit != undefined && item.time_limit >= 0) {
    result.timeLimit = item.time_limit.toString() + " ms";
  } else {
    result.timeLimit = "未知";
  }
  if (item.memory_limit != undefined && item.memory_limit >= 0) {
    result.memoryLimit = (item.memory_limit / 1024).toFixed(2) + " MB";
  } else {
    result.memoryLimit = "未知";
  }
  if (item.judge_type != undefined) {
    result.judgeType = GetJudgeTypeStr(item.judge_type);
  }
  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  if (item.modify_time != undefined) {
    result.updateTime = new Date(item.modify_time).toLocaleString();
  }
  if (item.modifier_nickname != undefined) {
    result.inserterNickname = item.modifier_nickname;
  }
  if (item.source != undefined) {
    // 判断item.source是否符合[]()格式，是否赋值result.sourceUrl
    const urlRegex = /\[([^\]]+)\]\(([^)]+)\)/;
    const match = item.source.match(urlRegex);
    if (match) {
      result.source = match[1];
      result.sourceUrl = match[2];
    } else {
      result.source = item.source;
      result.sourceUrl = "";
    }
  }
  if (item.judge_md5 != undefined) {
    result.judgeMd5 = item.judge_md5;
  }
  if (item.origin_oj != undefined) {
    result.originOj = item.origin_oj;
  }
  if (item.origin_id != undefined) {
    result.originId = item.origin_id;
  }
  if (item.origin_url != undefined) {
    result.originUrl = item.origin_url;
  }

  return result;
}

export function ParseProblemDaily(item: ProblemDaily, tagsMap: { [key: number]: ProblemTag }): ProblemDailyView {
  const result: ProblemDailyView = {} as ProblemDailyView;
  result.id = item.id;
  result.problemId = item.problem_id;
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
  if (item.accept) {
    result.accept = item.accept;
  } else {
    result.accept = 0;
  }
  if (item.attempt) {
    result.attempt = item.attempt;
  } else {
    result.attempt = 0;
  }
  result.solution = item.solution;
  result.code = item.code;

  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  if (item.modify_time != undefined) {
    result.modifyTime = new Date(item.modify_time).toLocaleString();
  }
  if (item.inserter_nickname != undefined) {
    result.inserterNickname = item.inserter_nickname;
  }
  if (item.modifier_nickname != undefined) {
    result.modifierNickname = item.modifier_nickname;
  }

  return result;
}

export function GetProblem(problemId: string, contestId: number | undefined, problemIndex: number | undefined) {
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

export function GetProblemList(oj: string, title: string, tag: string, privateData: boolean, page: number, pageSize: number) {
  const params = {} as any;
  if (oj) {
    params.oj = oj;
  }
  if (title) {
    params.title = title;
  }
  if (tag) {
    params.tag = tag;
  }
  if (privateData !== undefined) {
    params.private = privateData ? "1" : "0";
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

export function GetProblemRecommend(problemId: string) {
  const params = {} as any;
  if (problemId) {
    params.problem_id = problemId;
  }
  return httpRequest({
    url: `/problem/recommend?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetProblemDaily(dailyId: string) {
  return httpRequest({
    url: "/problem/daily" + "?id=" + dailyId,
    method: "get",
  });
}

export function GetProblemDailyEdit(dailyId: string) {
  return httpRequest({
    url: "/problem/daily/edit" + "?id=" + dailyId,
    method: "get",
  });
}

export function GetProblemDailyRecently() {
  return httpRequest({
    url: "/problem/daily/recently",
    method: "get",
  });
}

export function GetProblemDailyList(startDate: string, endData: string, problemId: string, page: number, pageSize: number) {
  const params = {} as any;
  if (startDate) {
    params.start_date = startDate;
  }
  if (endData) {
    params.end_date = endData;
  }
  if (problemId) {
    params.problem_id = problemId;
  }
  if (page) {
    params.page = page;
  }
  if (pageSize) {
    params.page_size = pageSize;
  }

  return httpRequest({
    url: `/problem/daily/list?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetProblemAttemptStatus(problemIds: string[]) {
  return httpRequest({
    url: "/problem/attempt/status",
    method: "get",
    params: {
      ids: problemIds.join(","),
    },
  });
}

export function PostProblemCrawl(oj: string, problemId: string) {
  return httpRequest({
    url: "/problem/crawl",
    method: "post",
    data: {
      oj: oj,
      id: problemId,
    },
  });
}

export function PostProblemCreate(
  title: string,
  timeLimit: number,
  memoryLimit: number,
  source: string,
  privateProblem: boolean,
  tags: string[],
  description: string
) {
  return httpRequest({
    url: "/problem/create",
    method: "post",
    data: {
      title: title,
      time_limit: timeLimit,
      memory_limit: memoryLimit,
      source: source,
      private: privateProblem,
      tags: tags,
      description: description,
    },
  });
}

export function PostProblemEdit(
  problemId: string,
  title: string,
  timeLimit: number,
  memoryLimit: number,
  source: string,
  privateProblem: boolean,
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
      private: privateProblem,
      tags: tags,
      description: description,
    },
  });
}

export function PostProblemDailyCreate(id: string, problemId: string, solution: string, code: string) {
  return httpRequest({
    url: "/problem/daily/create",
    method: "post",
    data: {
      id: id,
      problem_id: problemId,
      solution: solution,
      code: code,
    },
  });
}

export function PostProblemDailyEdit(dailyId: string, problemId: string, solution: string, code: string) {
  return httpRequest({
    url: "/problem/daily/edit",
    method: "post",
    data: {
      id: dailyId,
      problem_id: problemId,
      solution: solution,
      code: code,
    },
  });
}

export function GetJudgeDataDownload(id: string, key: string) {
  return httpRequest({
    url: "/problem/judge/data/download" + "?id=" + id + "&key=" + key,
    method: "get",
  });
}

export function GetProblemImageToken(problemId: string): Promise<UploadImageTokenResponse> {
  if (!problemId) {
    problemId = "";
  }
  return httpRequest({
    url: "/problem/image/token" + "?id=" + problemId,
    method: "get",
  });
}

export function GetProblemDailyImageToken(dailyId: string): Promise<UploadImageTokenResponse> {
  if (!dailyId) {
    dailyId = "";
  }
  return httpRequest({
    url: "/problem/daily/image/token" + "?id=" + dailyId,
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

export function PostProblemParseId(problemIds: number[]) {
  return httpRequest({
    url: "/problem/parse/id",
    method: "post",
    data: {
      problems: problemIds,
    },
  });
}

export function PostProblemParse(problemKeys: string[]) {
  return httpRequest({
    url: "/problem/parse",
    method: "post",
    data: {
      problems: problemKeys,
    },
  });
}
