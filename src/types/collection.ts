export interface Collection {
  id: string;
  title: string;
  inserter: number;
  inserter_username?: string;
  inserter_nickname?: string;
  insert_time: string;
  modify_time: string;
  start_time: string;
  end_time: string;
  description: string;
  problems: string[];
}

export interface CollectionView {
  id: string;
  title: string;
  inserter: number;
  inserterUsername?: string;
  inserterNickname?: string;
  insertTime: string;
  modifyTime: string;
  startTime: string;
  endTime: string;
  description: string;
  problems: string[];
}

export interface CollectionRank {
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  accept: number;
}

export interface CollectionRankView {
  index: number;
  rank: number;
  userId: number;
  username: string;
  nickname: string;
  accept: number;
}

export interface CollectionEditRequest {
  id?: number;
  title: string;
  description: string;
  problems: string[];
  members: number[];
  private: boolean;
  start_time?: Date;
  end_time?: Date;
}
