import { ProblemView } from "@/types/problem.ts";

export interface ContestState {
  starMembers: Record<number, Record<number, boolean>>; // 使用 Record 来存储星标成员
}

export interface ContestProblem {
  index: number;
  id: string;
  title: string;
  accept: number;
  attempt: number;
}

export interface Contest {
  id: string;
  title: string;
  inserter: number;
  inserter_username?: string;
  inserter_nickname?: string;
  insert_time: string;
  modifier: number;
  modifier_username?: string;
  modifier_nickname?: string;
  modify_time: string;
  start_time: string;
  end_time: string;
  private: boolean;
  description: string;
  notification: string;
  problems: ContestProblem[];
  submit_anytime: boolean;
}

export interface ContestView {
  id: string;
  title: string;
  inserter: number;
  inserterUsername?: string;
  inserterNickname?: string;
  insertTime: string;
  modifier: number;
  modifierUsername?: string;
  modifierNickname?: string;
  modifyTime: string;
  startTime: string;
  endTime: string;
  nowTime: Date;
  private: boolean;
  description: string;
  notification: string;
  problems: ProblemView[];
  submitAnytime: boolean;
}

export interface ContestRankProblem {
  index: number;
  attempt: number;
  ac: string;
  lock: number;
}

export interface ContestRank {
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  inserter_email: string;
  problems: ContestRankProblem[];
}

export interface ContestRankView {
  rank: string;
  userId: number;
  username: string;
  nickname: string;
  solved: number;
  penalty: number;

  [key: string]: any; // 索引签名，允许添加任意名字的字段
}

export interface ContestEditRequest {
  id?: number;
  title: string;
  description: string;
  notification: string;
  start_time?: Date;
  end_time?: Date;
  lock_rank_duration: number;
  always_lock: boolean;
  private: boolean;
  submit_anytime: boolean;
  password: string;
}
