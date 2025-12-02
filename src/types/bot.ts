export interface BotGame {
  id: number;
  key: string;
  title: string;
  description: string;
  judge_code: string;
  player_max: number;
  inserter: number;
  inserterNickname: string;
  inserterUsername: string;
  insert_time: string;
  modifier: number;
  modifierNickname: string;
  modifierUsername: string;
  modify_time: string;
}

export interface BotGameView {
  id: number;
  key: string;
  title: string;
  description: string;
  judgeCode: string;
  playerMax: number;
  inserter: number;
  inserterNickname: string;
  inserterUsername: string;
  insertTime: string;
  modifier: number;
  modifierNickname: string;
  modifierUsername: string;
  modifyTime: string;
}
