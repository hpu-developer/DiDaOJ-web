import { JudgeLanguage } from "@/apis/language.ts";
import { JudgeStatus } from "@/apis/judge.ts";

export interface JudgeJob {
  id: string;
  problem_id: string;
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
}

export interface JudgeJobView {
  id: string;
  problemId: string;
  status: JudgeStatus;
  score: string;
  time: string;
  memory: string;
  codeLength: number;
  author: number;
  authorUsername: string;
  authorNickname: string;
  language: string;
  approveTime: string;
  code?: string;
  compileMessage?: string;
}
