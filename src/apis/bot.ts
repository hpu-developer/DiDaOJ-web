import httpRequest from "@/apis/axios-api";

export function GetBotReplay(gameKey:string, replayId:number) {
  return httpRequest({
    url: "/bot/replay" + "?game_key=" + gameKey + "&replay_id=" + replayId,
    method: "get",
  });
}
