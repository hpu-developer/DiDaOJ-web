// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { JudgeTaskView, JudgeJob, JudgeJobView } from "@/types/judge";
import { GetJudgeLanguageStr, JudgeLanguage } from "@/apis/language.ts";

export enum JudgeType {
  Normal = 0,
  Special = 1,
}

export enum JudgeStatus {
  Init = 0,
  Rejudge = 1,
  Submitting = 2,
  Queuing = 3,
  Compiling = 4,
  Running = 5,
  Accept = 6,
  PE = 7,
  WA = 8,
  TLE = 9,
  MLE = 10,
  OLE = 11,
  RE = 12,
  CE = 13,
  CLE = 14,
  JudgeFail = 15,
  SubmitFail = 16,
  Unknown = 17,
}

export const GetJudgeTypeStr = (type: JudgeType) => {
  switch (type) {
    case JudgeType.Normal:
      return "普通评测";
    case JudgeType.Special:
      return "特殊评测";
    default:
      return "未知";
  }
};

export const GetJudgeStatusStr = (status: JudgeStatus) => {
  switch (status) {
    case JudgeStatus.Init:
      return "等待处理";
    case JudgeStatus.Rejudge:
      return "重新评测";
    case JudgeStatus.Submitting:
      return "提交中";
    case JudgeStatus.Queuing:
      return "队列中";
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
    case JudgeStatus.SubmitFail:
      return "提交失败";
    case JudgeStatus.Unknown:
      return "未知";
    default:
      return status;
  }
};

export function GetJudgeStatusOptions() {
  const exclude = [JudgeStatus.Unknown]; // 不想包含的语言
  return Object.values(JudgeStatus)
    .filter((v) => typeof v === "number" && !exclude.includes(v))
    .map((value) => ({
      value,
      label: GetJudgeStatusStr(value as JudgeStatus),
    })) as { label: string; value: JudgeStatus }[];
}

export function IsJudgeStatusRunning(status: JudgeStatus) {
  switch (status) {
    case JudgeStatus.Init:
    case JudgeStatus.Rejudge:
    case JudgeStatus.Submitting:
    case JudgeStatus.Queuing:
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
  result.taskCurrent = item.task_current;
  result.taskTotal = item.task_total;
  result.task = [];
  if (item.task) {
    for (let i = 0; i < item.task?.length; i++) {
      const task = item.task[i];
      const taskView = {} as JudgeTaskView;
      taskView.taskId = task.task_id;
      taskView.status = task.status;
      if (task.time) {
        // 保留到整数，向上取整
        taskView.time = Math.ceil(task.time / 1000000) + "ms";
      } else {
        taskView.time = "-";
      }
      if (task.memory) {
        // 保留两位数字
        taskView.memory = (task.memory / 1024 / 1024).toFixed(2) + "MB";
      } else {
        taskView.memory = "-";
      }
      taskView.score = task.score;
      taskView.content = task.content;
      taskView.waHint = task.wa_hint;
      if (!taskView.content && !taskView.waHint) {
        taskView.content = "无提示信息";
      }
      result.task.push(taskView);
    }
  }
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

export function GetJudgeJobList(problemId: string, username: string, language: JudgeLanguage, status: JudgeStatus, page: number, pageSize: number) {
  const params = new URLSearchParams({
    problem_id: problemId,
    username: username,
    language: String(language),
    status: String(status),
    page: String(page),
    page_size: String(pageSize),
  });
  return httpRequest({
    url: `/judge/list?${params.toString()}`,
    method: "get",
  });
}

export function PostRejudgeRecently() {
  return httpRequest({
    url: "/judge/rejudge/recently",
    method: "post",
  });
}

export function PostRejudgeAll() {
  return httpRequest({
    url: "/judge/rejudge/all",
    method: "post",
    // 可能用时较长，取消超时限制
    timeout: 0,
  });
}

export function PostRejudgeJob(id: number) {
  return httpRequest({
    url: "/judge/rejudge",
    method: "post",
    data: {
      id: id,
    },
  });
}
