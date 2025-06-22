import { JudgeLanguage } from "@/apis/language.ts";
import { JudgeStatus } from "@/apis/judge.ts";

export interface JudgeTask {
  task_id: string; // 代码长度
  status: JudgeStatus; // 评测状态
  time: number; // 所用的时间
  memory: number; // 所用的内存
  score: number; // 评分
  content: string; // 输出内容
  wa_hint: string; // 错误提示
}

export interface JudgeTaskView {
  taskId: string; // 代码长度
  status: JudgeStatus; // 评测状态
  time: string; // 所用的时间
  memory: string; // 所用的内存
  score: string; // 评分
  content: string; // 输出内容
  waHint: string; // 错误提示
}

export interface JudgeJob {
  id: string;
  problem_id: string;
  contest_problem_index: number;
  status: JudgeStatus;
  score: number;
  time: number;
  memory: number;
  code_length: number;
  author: number;
  author_username: string;
  author_nickname: string;
  language: JudgeLanguage;
  approve_time: string;
  code?: string;
  compile_message?: string;
  task_current: number;
  task_total: number;
  task?: JudgeTask[];

  judger?: string;
  judger_name?: string;
  judge_time?: string;
}

export interface JudgeJobView {
  id: string;
  problemId: string;
  contestProblemIndex: number;
  status: JudgeStatus;
  score: string;
  time: string;
  memory: string;
  codeLength: number;
  author: number;
  authorUsername: string;
  authorNickname: string;
  language: JudgeLanguage;
  approveTime: string;
  code?: string;
  compileMessage?: string;
  taskCurrent: number;
  taskTotal: number;
  task?: JudgeTaskView[];

  judger?: string;
  judgerName: string;
  judgeTime?: string;
}
