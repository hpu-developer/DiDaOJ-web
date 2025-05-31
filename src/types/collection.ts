import { DateMultipleValue } from "tdesign-vue-next";

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

export interface CollectionCreateRequest {
  title: string;
  description: string;
  open_time: DateMultipleValue;
}
