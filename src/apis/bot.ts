import httpRequest from "@/apis/axios-api";
import type { BotGame, BotGameView, BotReplay, BotReplayView } from "@/types/bot";

export enum BotStatus {
  BotStatusInit = 0,
  BotStatusQueuing = 1,
  BotStatusCompiling = 2,
  BotStatusRunning = 3,
  BotStatusFinish = 4,
  BotStatusTLE = 5,
  BotStatusMLE = 6,
  BotStatusOLE = 7,
  BotStatusRE = 8,
  BotStatusCE = 9,
  BotStatusCLE = 10,
  BotStatusJudgeFail = 11,
  BotStatusUnknown = 12,
  BotStatusMax,
}

export function IsBotStatusRunning(status: BotStatus) {
  switch (status) {
    case BotStatus.BotStatusInit:
    case BotStatus.BotStatusQueuing:
    case BotStatus.BotStatusCompiling:
    case BotStatus.BotStatusRunning:
      return true;
    default:
      return false;
  }
}

// 回放相关函数
export function GetBotReplayList(gameKey?: string, page: number = 1, pageSize: number = 20) {
  let url = `/bot/replay/list?page=${page}&page_size=${pageSize}`;
  if (gameKey) {
    url += `&game_key=${gameKey}`;
  }
  return httpRequest({
    url,
    method: "get",
  });
}

export function GetBotStatusStr(status: BotStatus): string {
  switch (status) {
    case BotStatus.BotStatusInit:
      return "初始化";
    case BotStatus.BotStatusQueuing:
      return "排队中";
    case BotStatus.BotStatusCompiling:
      return "编译中";
    case BotStatus.BotStatusRunning:
      return "运行中";
    case BotStatus.BotStatusFinish:
      return "完成";
    case BotStatus.BotStatusTLE:
      return "超时";
    case BotStatus.BotStatusMLE:
      return "内存超限";
    case BotStatus.BotStatusOLE:
      return "输出超限";
    case BotStatus.BotStatusRE:
      return "运行错误";
    case BotStatus.BotStatusCE:
      return "编译错误";
    case BotStatus.BotStatusCLE:
      return "编译环境错误";
    case BotStatus.BotStatusJudgeFail:
      return "评测失败";
    case BotStatus.BotStatusUnknown:
      return "未知状态";
    default:
      return "无效状态";
  }
}

export function GetBotStatusTheme(status: BotStatus): string {
  switch (status) {
    case BotStatus.BotStatusInit:
    case BotStatus.BotStatusQueuing:
    case BotStatus.BotStatusCompiling:
    case BotStatus.BotStatusRunning:
      return "warning";
    case BotStatus.BotStatusFinish:
      return "success";
    case BotStatus.BotStatusTLE:
    case BotStatus.BotStatusMLE:
    case BotStatus.BotStatusOLE:
    case BotStatus.BotStatusRE:
    case BotStatus.BotStatusCE:
    case BotStatus.BotStatusCLE:
    case BotStatus.BotStatusJudgeFail:
    case BotStatus.BotStatusUnknown:
      return "danger";
    default:
      return "default";
  }
}

export function ParseBotReplay(item: BotReplay): BotReplayView {
  const result: BotReplayView = {} as BotReplayView;
  result.id = item.id;
  result.gameKey = item.game_key;
  result.gameTitle = item.game_title;
  result.status = item.status;
  result.players = item.players;
  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  return result;
}

export function ParseBotGame(item: BotGame): BotGameView {
  const result: BotGameView = {} as BotGameView;
  result.id = item.id;
  result.key = item.key;
  result.title = item.title;
  result.description = item.description;
  result.judgeCode = item.judge_code;
  result.playerMax = item.player_max;
  result.inserter = item.inserter;
  result.inserterNickname = item.inserterNickname;
  result.inserterUsername = item.inserterUsername;
  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
  result.modifier = item.modifier;
  result.modifierNickname = item.modifierNickname;
  result.modifierUsername = item.modifierUsername;
  if (item.modify_time != undefined) {
    result.modifyTime = new Date(item.modify_time).toLocaleString();
  }
  return result;
}

export function GetBotGame(gameKey: string) {
  return httpRequest({
    url: "/bot/game" + "?game_key=" + gameKey,
    method: "get",
  });
}

export function GetBotReplay(gameKey: string, replayId: number) {
  return httpRequest({
    url: "/bot/replay" + "?game_key=" + gameKey + "&replay_id=" + replayId,
    method: "get",
  });
}

export function GetBotReplayParam(gameKey: string, replayId: number) {
  return httpRequest({
    url: "/bot/replay/param" + "?game_key=" + gameKey + "&replay_id=" + replayId,
    method: "get",
  });
}

// 需要在bot.ts中添加GetBotGameImageToken函数
export function GetBotGameImageToken(gameId: number) {
  return httpRequest({
    url: "/bot/game/image/token" + "?game_id=" + gameId,
    method: "get",
  });
}

// 需要在bot.ts中添加PostBotGameCreate函数
export function PostBotGameCreate(title: string, description: string, judgeCode: string) {
  return httpRequest({
    url: "/bot/game/create",
    method: "post",
    data: {
      title,
      description,
      judge_code: judgeCode,
    },
  });
}

// 需要在bot.ts中添加PostBotGameEdit函数
export function PostBotGameEdit(gameId: number, title: string, description: string, judgeCode: string) {
  return httpRequest({
    url: "/bot/game/edit",
    method: "post",
    data: {
      game_id: gameId,
      title,
      description,
      judge_code: judgeCode,
    },
  });
}
