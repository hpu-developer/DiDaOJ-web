export interface BotGame {
  id: number;
  game_key: string;
  title: string;
  introduction?: string;
  description?: string;
  judge_code: string;
  player_min: number;
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
  gameKey: string;
  title: string;
  introduction?: string;
  description?: string;
  judgeCode?: string;
  playerMin?: number;
  playerMax?: number;
  inserter?: number;
  inserterNickname?: string;
  inserterUsername?: string;
  insertTime?: string;
  modifier?: number;
  modifierNickname?: string;
  modifierUsername?: string;
  modifyTime?: string;
}

// 机器人相关类型定义
export interface BotAgent {
  id: number;
  name: string;
  username: string;
  version: number;
  inserter: number;
  inserter_username: string;
  inserter_nickname: string;
  inserter_email?: string;
}

export interface BotAgentView {
  id: number;
  name: string;
  version: number;
  inserter: number;
  inserterUsername: string;
  inserterNickname: string;
  inserterEmail?: string;
}

// 回放相关类型定义
export interface BotReplay {
  id: number;
  game_key: string;
  game_title: string;
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
  gameTitle: string;
  status: number;
  players: {
    id: number;
    nickname: string;
    username: string;
  }[];
  insertTime: string;
}
