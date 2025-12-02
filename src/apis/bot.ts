import httpRequest from "@/apis/axios-api";
import type { BotGame, BotGameView } from "@/types/bot";

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

export function ParseBotGame(item: BotGame): BotGameView {
  const result: BotGameView = {} as BotGameView;
  result.id = item.id;
  result.key = item.key;
  result.title = item.title;
  result.description = item.description;
  result.judgeCode = item.judge_code;
  result.inserter = item.inserter;
  if (item.insert_time != undefined) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  }
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
