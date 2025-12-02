import httpRequest from "@/apis/axios-api";

export enum BotStatus {
    BotStatusInit      = 0,
    BotStatusQueuing   = 1,
    BotStatusCompiling = 2,
    BotStatusRunning   = 3,
    BotStatusFinish    = 4,
    BotStatusTLE       = 5,
    BotStatusMLE       = 6,
    BotStatusOLE       = 7,
    BotStatusRE        = 8,
    BotStatusCE        = 9,
    BotStatusCLE       = 10,
    BotStatusJudgeFail = 11,
    BotStatusUnknown   = 12,
    BotStatusMax       ,
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

export function GetBotReplay(gameKey:string, replayId:number) {
  return httpRequest({
    url: "/bot/replay" + "?game_key=" + gameKey + "&replay_id=" + replayId,
    method: "get",
  });
}

export function GetBotReplayParam(gameKey:string, replayId:number) {
  return httpRequest({
    url: "/bot/replay/param" + "?game_key=" + gameKey + "&replay_id=" + replayId,
    method: "get",
  });
}
