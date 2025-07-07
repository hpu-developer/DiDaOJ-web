import { ParseValidType } from "@/util/parse.ts";

export interface ProblemTag {
  id: number;
  name: string;
}

export interface Problem {
  id: number;
  key: string; // 对外展示的唯一标识符
  title: string;
  tags?: number[];
  private?: boolean;
  accept?: number;
  attempt?: number;
  description?: string;
  time_limit?: number;
  memory_limit?: number;
  judge_type?: number;
  inserter?: string;
  inserter_nickname?: string;
  inserter_username?: string;
  insert_time?: string;
  modifier?: string;
  modifier_nickname?: string;
  modify_time?: string;
  source?: string;
  judge_md5?: string;
  origin_oj?: string;
  origin_id?: string;
  origin_url?: string;

  valid?: ParseValidType; // 是否有效，true表示有效，false表示无效
}

export interface ProblemView {
  id: number;
  key: string; // 对外展示的唯一标识符

  title: string;
  private?: boolean;
  tags?: ProblemTag[];
  accept?: number;
  attempt?: number;
  description?: string;
  timeLimit?: string;
  memoryLimit?: string;
  judgeType?: string;
  insertTime?: string;
  inserter?: string;
  inserterNickname?: string;
  modifier?: string;
  modifierNickname?: string;
  modifyTime?: string;
  source?: string;
  sourceUrl?: string;
  judgeMd5?: string;
  originOj?: string;
  originId?: string;
  originUrl?: string;

  index?: number; // 仅限Contest题目

  valid?: ParseValidType; // 是否有效，true表示有效，false表示无效
}

export interface ProblemJudgeData {
  key: string;
  size: number;
  last_modified: string;
}

export interface ProblemDaily {
  key: string;
  problem_id: string;
  title: string;
  tags: number[];
  accept: number;
  attempt: number;
  solution?: string;
  code?: string;

  insert_time?: string; // 创建时间
  modify_time?: string; // 编辑时间
  inserter_nickname?: string; // 创建者昵称
  modifier_nickname?: string; // 编辑者昵称
}

export interface ProblemDailyView {
  key: string;
  problemId: string;
  title: string;
  tags: ProblemTag[];
  accept: number;
  attempt: number;
  solution?: string;
  code?: string;

  insertTime?: string; // 创建时间
  modifyTime?: string; // 修改时间
  inserterNickname?: string; // 创建者昵称
  modifierNickname?: string; // 修改者昵称
}
