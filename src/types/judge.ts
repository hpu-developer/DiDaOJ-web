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
  author: string;
  language: JudgeLanguage;
  approve_time: string;
}

export interface JudgeJobView {
  id: string;
  problemId: string;
  status: JudgeStatus;
  score: string;
  time: string;
  memory: string;
  codeLength: number;
  author: string;
  language: string;
  approveTime: string;
}
