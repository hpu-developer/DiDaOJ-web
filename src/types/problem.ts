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
