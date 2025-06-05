import { ProblemView } from "@/types/problem.ts";

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
  owner_id: string;
  owner_username?: string;
  owner_nickname?: string;
  create_time: string;
  update_time: string;
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
  ownerId: string;
  ownerUsername?: string;
  ownerNickname?: string;
  createTime: string;
  updateTime: string;
  startTime: string;
  endTime: string;
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
  author_id: number;
  author_username: string;
  author_nickname: string;
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
