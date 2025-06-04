export interface Collection {
  id: string;
  title: string;
  owner_id: number;
  owner_username?: string;
  owner_nickname?: string;
  create_time: string;
  update_time: string;
  start_time: string;
  end_time: string;
  description: string;
  problems: string[];
}

export interface CollectionView {
  id: string;
  title: string;
  ownerId: number;
  ownerUsername?: string;
  ownerNickname?: string;
  createTime: string;
  updateTime: string;
  startTime: string;
  endTime: string;
  description: string;
  problems: string[];
}

export interface CollectionRank {
  author_id: number;
  author_username: string;
  author_nickname: string;
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
