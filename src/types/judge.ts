import { JudgeLanguage } from "@/apis/language.ts";
import { JudgeStatus } from "@/apis/judge.ts";

export interface JudgeTask {
  task_id: string; // 代码长度
  status: JudgeStatus; // 评测状态
  time: number; // 所用的时间
  memory: number; // 所用的内存
  score: number; // 评分
  content: string; // 输出内容
  hint: string; // 错误提示
}

export interface JudgeTaskView {
  taskId: string; // 代码长度
  status: JudgeStatus; // 评测状态
  time: string; // 所用的时间
  memory: string; // 所用的内存
  score: string; // 评分
  content: string; // 输出内容
  hint: string; // 错误提示
}

export interface JudgeJob {
  id: string;
  problem_id: string;
  problem_key: string;
  contest_problem_index: number;
  status: JudgeStatus;
  score: number;
  time: number;
  memory: number;
  code_length: number;
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  language: JudgeLanguage;
  insert_time: string;
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
  problemKey: string;
  contestProblemIndex: number;
  status: JudgeStatus;
  score: string;
  time: string;
  memory: string;
  codeLength: number;
  inserter: number;
  inserterUsername: string;
  inserterNickname: string;
  language: JudgeLanguage;
  insertTime: string;
  code?: string;
  compileMessage?: string;
  taskCurrent: number;
  taskTotal: number;
  task?: JudgeTaskView[];

  judger?: string;
  judgerName: string;
  judgeTime?: string;
}
