export interface BotGame {
  id: number;
  key: string;
  title: string;
  description: string;
  judge_code: string;
  inserter: number;
  insert_time: string;
  modify_time: string;
}

export interface BotGameView {
  id: number;
  key: string;
  title: string;
  description: string;
  judgeCode: string;
  inserter: number;
  insertTime: string;
  modifyTime: string;
}
