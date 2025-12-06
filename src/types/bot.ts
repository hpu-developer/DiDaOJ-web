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

// 回放相关类型定义
export interface BotReplay {
  id: number;
  game_key: string;
  game_name: string;
  status: number;
  players: {
    id: number;
    nickname: string;
    username: string;
  }[];
  insert_time: string;
}

export interface BotReplayView {
  id: number;
  gameKey: string;
  gameName: string;
  status: number;
  players: {
    id: number;
    nickname: string;
    username: string;
  }[];
  insertTime: string;
}
