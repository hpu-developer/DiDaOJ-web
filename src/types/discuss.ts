export interface DiscussTag {
  id: number;
  name: string;
}

export interface Discuss {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_username: string;
  author_nickname: string;
  insert_time: string;
  modify_time: string;
  update_time: string;

  problem_id: string;
  problem_title: string;
  contest_id: string;
  contest_title: string;
  contest_problem_index: number;
}

export interface DiscussView {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorUsername: string;
  authorNickname: string;
  insertTime: string;
  modifyTime: string;
  updateTime: string;

  problemId: string;
  problemTitle: string;
  contestId: string;
  contestTitle: string;
  contestProblemIndex: number;
}

export interface DiscussComment {
  id: number;
  content: string;
  author_id: string;
  author_username: string;
  author_nickname: string;
  insert_time: string;
  modify_time: string;
  update_time: string;
}

export interface DiscussCommentView {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  authorNickname: string;
  insertTime: string;
  modifyTime: string;
  updateTime: string;
}

export interface DiscussEditRequest {
  id?: number;
  title: string;
  content: string;
  problem_id?: string;
}

export interface DiscussCommentEditRequest {
  id?: number;
  discuss_id: number;
  content: string;
}
