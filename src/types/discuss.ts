export interface DiscussTag {
  id: number;
  name: string;
}

export interface Discuss {
  id: number;
  title: string;
  content: string;
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  inserter_email: string;
  insert_time: string;
  modify_time: string;
  update_time: string;

  problem_id: number;
  problem_key: string;
  problem_title: string;
  contest_id: string;
  contest_title: string;
  contest_problem_index: number;
}

export interface DiscussView {
  id: number;
  title: string;
  content: string;
  inserter: number;
  inserterUsername: string;
  inserterNickname: string;
  inserterEmail: string;
  avatarUrl?: string;
  insertTime: string;
  modifyTime: string;
  updateTime: string;

  problemId: number;
  problemKey: string;
  problemTitle: string;
  contestId: string;
  contestTitle: string;
  contestProblemIndex: number;
}

export interface DiscussComment {
  id: number;
  content: string;
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  inserter_email: string;
  insert_time: string;
  modify_time: string;
  update_time: string;
}

export interface DiscussCommentView {
  id: number;
  content: string;
  inserter: number;
  inserterUsername: string;
  inserterNickname: string;
  inserterEmail: string;
  avatarUrl?: string;
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
