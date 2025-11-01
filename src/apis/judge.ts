// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { JudgeTaskView, JudgeJob, JudgeJobView } from "@/types/judge";
import { JudgeLanguage } from "@/apis/language.ts";
import type { ButtonProps } from "tdesign-vue-next";

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
  Max,
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
const JudgeStatusColorMap: Partial<Record<JudgeStatus, string>> = {
  [JudgeStatus.Init]: "#95a5a6",
  [JudgeStatus.Rejudge]: "#7f8c8d",
  [JudgeStatus.Submitting]: "#3498db",
  [JudgeStatus.Queuing]: "#2980b9",
  [JudgeStatus.Compiling]: "#9b59b6",
  [JudgeStatus.Running]: "#8e44ad",
  [JudgeStatus.Accept]: "#2ecc71",
  [JudgeStatus.PE]: "rgba(225,255,30,0.5)",
  [JudgeStatus.WA]: "#e74c3c",
  [JudgeStatus.TLE]: "#e67e22",
  [JudgeStatus.MLE]: "#d35400",
  [JudgeStatus.OLE]: "#f39c12",
  [JudgeStatus.RE]: "#c0392b",
  [JudgeStatus.CE]: "#7f8c8d",
  [JudgeStatus.CLE]: "#d35400",
  [JudgeStatus.JudgeFail]: "#e74c3c",
  [JudgeStatus.SubmitFail]: "#e74c3c",
  [JudgeStatus.Unknown]: "#bdc3c7",
};

// 用于缓存未定义状态的随机颜色，保证状态 -> 颜色稳定
const RandomColorCache: Record<number, string> = {};

const randomColor = () =>
  "#" +
  Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");

export const GetJudgeStatusColor = (status: JudgeStatus) => {
  if (JudgeStatusColorMap[status]) {
    return JudgeStatusColorMap[status];
  }
  if (!RandomColorCache[status]) {
    RandomColorCache[status] = randomColor();
  }
  return RandomColorCache[status];
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
      return "无效";
  }
};

export const GetJudgeStatusTips = (status: JudgeStatus | undefined): string => {
  if (status !== undefined) {
    switch (status) {
      case JudgeStatus.Init:
        return "已经提交到系统，请耐心等待评测结果";
      case JudgeStatus.Rejudge:
        return "管理员发起了重新评测，请耐心等待评测结果";
      case JudgeStatus.Submitting:
        return "判题机已经接受了本次提交，正在提交到远程判官中";
      case JudgeStatus.Queuing:
        return "判题机已经接受了本次提交，正在排队等待评测";
      case JudgeStatus.Compiling:
        return "判题机正在编译您的代码，部分语言会在此步检查是否符合语法";
      case JudgeStatus.Running:
        return "您的代码正在运行，请等待运行结果";
      case JudgeStatus.Accept:
        return "您的代码通过了测试用例，恭喜您！";
      case JudgeStatus.PE:
        return "您的代码基本正确，但可能存在空格、空行等格式错误，请认真对比输出要求";
      case JudgeStatus.WA:
        return "您的答案与标准答案存在区别，请继续思考有无未考虑的情况";
      case JudgeStatus.TLE:
        return "运行您的代码所用的时间超过了题目限制，请思考时间上更优的解法";
      case JudgeStatus.MLE:
        return "运行您的代码所用的内存超过了题目限制，请思考空间上更优的解法";
      case JudgeStatus.OLE:
        return "您程序的输出内容远远多于了题目要求（一般是数倍于正确输出），请检查相关逻辑";
      case JudgeStatus.RE:
        return "在运行您程序的过程中发生了异常，可能是除零、数组越界等问题，请检查相关逻辑";
      case JudgeStatus.CE:
        return "您的代码在编译阶段发生了错误，可能是语法错误或其他编译问题，请检查相关逻辑";
      case JudgeStatus.CLE:
        return "在编译您代码的过程中，所占用的资源远远超过了要求，请检查相关逻辑";
      case JudgeStatus.JudgeFail:
        return "评测过程中发生了异常，一般是判题机或远程判官的问题，可尝试联系管理员处理";
      case JudgeStatus.SubmitFail:
        return "在将您的代码提交到远程判官的过程中发生了错误，一般是判题机或远程判官的问题，可联系管理员处理";
      case JudgeStatus.Unknown:
        return "您的代码状态未知，有可能是您不具有权限，或者该代码状态被隐藏";
    }
  }
  return "暂时无提示信息";
};

export const GetJudgeStatusTheme = (status: JudgeStatus): ButtonProps["theme"] => {
  switch (status) {
    case JudgeStatus.Init:
    case JudgeStatus.Rejudge:
    case JudgeStatus.Submitting:
    case JudgeStatus.Queuing:
    case JudgeStatus.Compiling:
    case JudgeStatus.Running:
    case JudgeStatus.Unknown:
      return "default";
    case JudgeStatus.Accept:
      return "success";
    case JudgeStatus.PE:
      return "warning";
    default:
      return "danger";
  }
};

export function GetJudgeStatusOptions() {
  const exclude = [JudgeStatus.Unknown, JudgeStatus.Max]; // 不想包含的状态
  return Object.values(JudgeStatus)
    .filter((v) => typeof v === "number" && !exclude.includes(v))
    .map((value) => ({
      value,
      label: GetJudgeStatusStr(value as JudgeStatus),
    })) as { label: string; value: JudgeStatus }[];
}

export function IsJudgeStatusValid(status: JudgeStatus) {
  return status >= JudgeStatus.Init && status < JudgeStatus.Unknown;
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
  result.problemKey = item.problem_key;
  result.contestProblemIndex = item.contest_problem_index;
  result.status = item.status;

  if (item.score == undefined || IsJudgeStatusRunning(item.status) || !IsJudgeStatusValid(item.status)) {
    result.score = "-";
  } else {
    result.score = (item.score / 10).toString();
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

  result.language = item.language;
  result.codeLength = item.code_length;
  if (item.insert_time) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  } else {
    result.insertTime = "-";
  }
  result.inserter = item.inserter;
  result.inserterUsername = item.inserter_username;
  result.inserterNickname = item.inserter_nickname;
  result.inserterEmail = item.inserter_email;
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
      if (task.score) {
        taskView.score = (task.score / 10).toString();
      } else {
        taskView.score = "-";
      }
      taskView.content = task.content;
      taskView.hint = task.hint;
      result.task.push(taskView);
    }
  }
  if (item.judger) {
    result.judger = item.judger;
  }
  if (item.judger_name) {
    result.judgerName = item.judger_name;
  } else {
    result.judgerName = "-";
  }
  if (item.judge_time) {
    result.judgeTime = new Date(item.judge_time).toLocaleString();
  }

  return result;
}

export function PostJudgeJob(problemId: number, contestId: number, problemIndex: number, language: JudgeLanguage, code: string) {
  return httpRequest({
    url: "/judge/approve",
    method: "post",
    data: {
      problem_id: problemId,
      contest_id: contestId,
      problem_index: problemIndex,
      language: language,
      code: code,
    },
  });
}

export function GetJudgeJob(judgeId: number, contestId: number) {
  let params = {
    id: judgeId,
  } as any;
  if (contestId) {
    params["contest_id"] = contestId;
  }
  return httpRequest({
    url: "/judge" + "?" + new URLSearchParams(params).toString(),
    method: "get",
  });
}

export function GetJudgeJobCode(judgeId: number) {
  return httpRequest({
    url: "/judge/code" + "?id=" + judgeId,
    method: "get",
  });
}

export function GetJudgeJobList(
  contestId: number,
  problemKey: string,
  username: string,
  language: JudgeLanguage | undefined,
  status: JudgeStatus | undefined,
  page: number,
  pageSize: number
) {
  let params = {
    problem_key: problemKey,
    username: username,
    language: String(language),
    status: String(status),
    page: String(page),
    page_size: String(pageSize),
  } as any;
  if (contestId) {
    params["contest_id"] = String(contestId);
  }
  return httpRequest({
    url: `/judge/list?${new URLSearchParams(params).toString()}`,
    method: "get",
  });
}

export function GetJudgeStaticsRecently() {
  return httpRequest({
    url: "/judge/statics/recently",
    method: "get",
  });
}

export function PostRejudgeRecently() {
  return httpRequest({
    url: "/judge/rejudge/recently",
    method: "post",
  });
}

export function PostRejudgeSearch(problemKey: string, language: JudgeLanguage | undefined, status: JudgeStatus | undefined) {
  const data = {} as any;
  if (problemKey != undefined) {
    data["problem_key"] = problemKey;
  }
  if (language != undefined) {
    data["language"] = language;
  } else {
    data["language"] = JudgeLanguage.Unknown;
  }
  if (status != undefined) {
    data["status"] = status;
  } else {
    data["status"] = JudgeStatus.Max;
  }
  return httpRequest({
    url: "/judge/rejudge/search",
    method: "post",
    data: data,
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
      id: Number(id),
    },
  });
}
