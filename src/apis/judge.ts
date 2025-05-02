// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { JudgeJob, JudgeJobView } from "@/types/judge";
import { GetJudgeLanguageStr, JudgeLanguage } from "@/apis/language.ts";

export enum JudgeStatus {
  Init = 0,
  Rejudge = 1,
  Compiling = 2,
  Running = 3,
  Accept = 4,
  PE = 5,
  WA = 6,
  TLE = 7,
  MLE = 8,
  OLE = 9,
  RE = 10,
  CE = 11,
  CLE = 12,
  JudgeFail = 13,
}

export const GetJudgeStatusStr = (status: JudgeStatus) => {
  switch (status) {
    case JudgeStatus.Init:
      return "等待处理";
    case JudgeStatus.Rejudge:
      return "重新评测";
    case JudgeStatus.Compiling:
      return "编译中";
    case JudgeStatus.Running:
      return "运行中";
    case JudgeStatus.Accept:
      return "通过";
    case JudgeStatus.PE:
      return "格式错误";
    case JudgeStatus.WA:
      return "答案错误";
    case JudgeStatus.TLE:
      return "超时";
    case JudgeStatus.MLE:
      return "内存超限";
    case JudgeStatus.OLE:
      return "输出超限";
    case JudgeStatus.RE:
      return "运行错误";
    case JudgeStatus.CE:
      return "编译错误";
    case JudgeStatus.CLE:
      return "编译超限";
    case JudgeStatus.JudgeFail:
      return "评测失败";
    default:
      return status;
  }
};

export function IsJudgeStatusRunning(status: JudgeStatus) {
  switch (status) {
    case JudgeStatus.Init:
    case JudgeStatus.Rejudge:
    case JudgeStatus.Compiling:
    case JudgeStatus.Running:
      return true;
    default:
      return false;
  }
}

export function ParseJudgeJob(item: JudgeJob): JudgeJobView {
  const result: JudgeJobView = {} as JudgeJobView;
  result.id = item.id;
  result.problemId = item.problem_id;
  result.status = item.status;

  if (IsJudgeStatusRunning(item.status)) {
    result.score = "-";
  } else {
    result.score = item.score.toString();
  }
  if (item.time) {
    // 保留到整数，向上取整
    result.time = Math.ceil(item.time / 1000000) + "ms";
  } else {
    result.time = "-";
  }
  if (item.memory) {
    // 保留两位数字
    result.memory = (item.memory / 1024 / 1024).toFixed(2) + "MB";
  } else {
    result.memory = "-";
  }

  result.language = GetJudgeLanguageStr(item.language);
  result.codeLength = item.code_length;
  if (item.approve_time) {
    result.approveTime = new Date(item.approve_time).toLocaleString();
  } else {
    result.approveTime = "-";
  }
  result.author = item.author;
  result.authorUsername = item.author_username;
  result.authorNickname = item.author_nickname;
  result.code = item.code;
  result.compileMessage = item.compile_message;
  return result;
}

export function PostJudgeJob(problemId: string, language: JudgeLanguage, code: string) {
  return httpRequest({
    url: "/judge/approve",
    method: "post",
    data: {
      problem_id: problemId,
      language: language,
      code: code,
    },
  });
}

export function GetJudgeJob(judgeId: number) {
  return httpRequest({
    url: "/judge" + "?id=" + judgeId,
    method: "get",
  });
}

export function GetJudgeJobList(page: number, pageSize: number) {
  return httpRequest({
    url: "/judge/list" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}
