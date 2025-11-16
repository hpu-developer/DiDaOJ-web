// 导入axios实例
import httpRequest from "@/apis/axios-api";
import { JudgeLanguage } from "./language";

export enum RunStatus {
  Init = 0,
  Queuing = 1,
  Compiling = 2,
  Running = 3,
  Finish = 4,
  TLE = 5,
  MLE = 6,
  OLE = 7,
  RE = 8,
  CE = 9,
  CLE = 10,
	RunFail = 11,
  Max,
}

export const GetRunStatusStr = (status: RunStatus) => {
  switch (status) {
    case RunStatus.Init:
      return "等待处理";
    case RunStatus.Queuing:
      return "队列中";
    case RunStatus.Compiling:
      return "编译中";
    case RunStatus.Running:
      return "运行中";
    case RunStatus.Finish:
      return "已完成";
    case RunStatus.MLE:
      return "内存超限";
    case RunStatus.OLE:
      return "输出超限";
    case RunStatus.RE:  
      return "运行错误";
    case RunStatus.CE:
      return "编译错误";
    case RunStatus.CLE:
      return "编译超限";
    case RunStatus.RunFail:
      return "运行失败";
    default:
      return "无效";
  }
};

export const GetRunStatusTips = (status: RunStatus | undefined): string => {
  if (status !== undefined) {
    switch (status) {
      case RunStatus.Init:
        return "已经提交到系统，请耐心等待评测结果";
      case RunStatus.Queuing:
        return "判题机已经接受了本次提交，正在排队等待评测";
      case RunStatus.Compiling:
        return "判题机正在编译您的代码，部分语言会在此步检查是否符合语法";
      case RunStatus.Running:
        return "您的代码正在运行，请等待运行结果";
      case RunStatus.Finish:
        return "您的代码已完成运行";
      case RunStatus.TLE:
        return "运行您的代码所用的时间超过了题目限制，请思考时间上更优的解法";
      case RunStatus.MLE:
        return "运行您的代码所用的内存超过了题目限制，请思考空间上更优的解法";
      case RunStatus.OLE:
        return "您程序的输出内容远远多于了题目要求（一般是数倍于正确输出），请检查相关逻辑";
      case RunStatus.RE:
        return "在运行您程序的过程中发生了异常，可能是除零、数组越界等问题，请检查相关逻辑";
      case RunStatus.CE:
        return "您的代码在编译阶段发生了错误，可能是语法错误或其他编译问题，请检查相关逻辑";
      case RunStatus.CLE:
        return "您的代码在编译阶段所用的时间超过了题目限制，请思考时间上更优的解法";
      case RunStatus.RunFail:
        return "您的代码在运行阶段发生了异常，可能是除零、数组越界等问题，请检查相关逻辑";
    }
  }
  return "";
};

export function IsRunStatusRunning(status: RunStatus) {
  switch (status) {
    case RunStatus.Init:
    case RunStatus.Queuing:
    case RunStatus.Compiling:
    case RunStatus.Running:
      return true;
    default:
      return false;
  }
}

// 提交代码运行
export function PostRunCode(data: {
  code: string;
  input: string;
  language: JudgeLanguage;
}) {
  return httpRequest({
    url: "/run",
    method: "post",
    data: data,
  });
}

// 获取代码运行状态
export function GetRunCodeState(runId: number) {
  return httpRequest({
    url: "/run/status",
    method: "get",
    params: {
      id: runId,
    },
  });
}
