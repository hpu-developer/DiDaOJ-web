export interface ProblemTag {
  id: number;
  name: string;
}

export interface Problem {
  id: string;
  title: string;
  author: string;
  tags: number[];
  private: boolean;
  accept: number;
  attempt: number;
  description?: string;
  time_limit?: number;
  memory_limit?: number;
  judge_type?: number;
  insert_time?: string;
  update_time?: string;
  creator_nickname?: string;
  source?: string;
  judge_md5?: string;
  origin_oj?: string;
  origin_id?: string;
  origin_url?: string;
}

export interface ProblemView {
  index?: number; // 仅限Contest题目

  id: string;
  title: string;
  author: string;
  private: boolean;
  tags: ProblemTag[];
  accept: number;
  attempt: number;
  description?: string;
  timeLimit?: string;
  memoryLimit?: string;
  judgeType?: string;
  insertTime?: string;
  updateTime?: string;
  creatorNickname?: string;
  source?: string;
  sourceUrl?: string;
  judgeMd5?: string;
  originOj?: string;
  originId?: string;
  originUrl?: string;
}

export interface ProblemJudgeData {
  key: string;
  size: number;
  last_modified: string;
}

export interface ProblemDaily {
  id: string;
  problem_id: string;
  title: string;
  tags: number[];
  accept: number;
  attempt: number;
  solution?: string;
  code?: string;

  create_time?: string; // 创建时间
  update_time?: string; // 更新时间
  creator_nickname?: string; // 创建者昵称
  updater_nickname?: string; // 更新者昵称
}

export interface ProblemDailyView {
  id: string;
  problemId: string;
  title: string;
  tags: ProblemTag[];
  accept: number;
  attempt: number;
  solution?: string;
  code?: string;

  createTime?: string; // 创建时间
  updateTime?: string; // 更新时间
  creatorNickname?: string; // 创建者昵称
  updaterNickname?: string; // 更新者昵称
}
