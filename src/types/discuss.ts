export interface DiscussTag {
  id: number;
  name: string;
}

export interface Discuss {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_username: string;
  author_nickname: string;
  insert_time: string;
  modify_time: string;
  update_time: string;
}

export interface DiscussView {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorNickname: string;
  insertTime: string;
  modifyTime: string;
  updateTime: string;
}

export interface DiscussComment {
  id: string;
  content: string;
  author_id: string;
  author_username: string;
  author_nickname: string;
  insert_time: string;
  modify_time: string;
  update_time: string;
}

export interface DiscussCommentView {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorNickname: string;
  insertTime: string;
  modifyTime: string;
  updateTime: string;
}

export interface DiscussCreateRequest {
  title: string;
  content: string;
}
