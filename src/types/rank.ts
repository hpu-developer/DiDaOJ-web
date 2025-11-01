import { JudgeLanguage } from "@/apis/language.ts";

export interface UserRank {
  index: number;

  userId: number;
  username: string;
  nickname: string;
  accepted: number;
  attempted: number;
}

export interface ProblemRank {
  index: number;

  id: number;
  time: number;
  memory: number;
  code_length: number;
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  inserter_email: string;
  language: JudgeLanguage;
  insert_time: string;
}

export interface ProblemRankView {
  index: number;

  id: number;
  time: number;
  memory: number;
  codeLength: number;
  inserter: number;
  inserterUsername: string;
  inserterNickname: string;
  inserterEmail: string;
  language: JudgeLanguage;
  insertTime: string;
}
