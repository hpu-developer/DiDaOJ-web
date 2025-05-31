import { DateMultipleValue } from "tdesign-vue-next";
import { CollectionRankProblem } from "@/types/contest.ts";

export interface Collection {
  id: string;
  title: string;
  owner_id: string;
  owner_username?: string;
  owner_nickname?: string;
  start_time: string;
  end_time: string;
  description: string;
  problems: string[];
}

export interface CollectionView {
  id: string;
  title: string;
  ownerId: string;
  ownerUsername?: string;
  ownerNickname?: string;
  startTime: string;
  endTime: string;
  descriptions: string;
  problems: string[];
}

export interface CollectionRank {
  author_id: number;
  author_username: string;
  author_nickname: string;
}

export interface CollectionRankView {
  rank: number;
  userId: number;
  username: string;
  nickname: string;
  accept: number;
}

export interface CollectionCreateRequest {
  title: string;
  description: string;
  open_time: DateMultipleValue;
}
