import { DateMultipleValue } from "tdesign-vue-next";

export interface Contest {
  id: string;
  title: string;
  owner_id: string;
  owner_username?: string;
  owner_nickname?: string;
  start_time: string;
  end_time: string;
}

export interface ContestView {
  id: string;
  title: string;
  ownerId: string;
  ownerUsername?: string;
  ownerNickname?: string;
  startTime: string;
  endTime: string;
}

export interface ContestCreateRequest {
  title: string;
  description: string;
  open_time: DateMultipleValue;
}
