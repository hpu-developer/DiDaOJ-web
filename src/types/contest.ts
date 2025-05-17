import { DateMultipleValue } from "tdesign-vue-next";

export interface ContestDescription {
  title: string;
  content: string;
  sort: number;
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
  owner_id: string;
  owner_username?: string;
  owner_nickname?: string;
  start_time: string;
  end_time: string;
  descriptions: ContestDescription[];
  notification: string;
  problems: ContestProblem[];
}

export interface ContestView {
  id: string;
  title: string;
  ownerId: string;
  ownerUsername?: string;
  ownerNickname?: string;
  startTime: string;
  endTime: string;
  descriptions: ContestDescription[];
  notification: string;
  problems: ContestProblem[];
}

export interface ContestCreateRequest {
  title: string;
  description: string;
  open_time: DateMultipleValue;
}
