export enum RemoteJudgeType {
  DidaOJ = 0,
  Hdu = 1,
  Poj = 2,
  Max,
}

export function GetRemoteJudgeTypeByStr(typeStr: string) {
  if (!typeStr) {
    return RemoteJudgeType.DidaOJ;
  }
  switch (typeStr.toLowerCase()) {
    case "didaoj":
      return RemoteJudgeType.DidaOJ;
    case "hdu":
      return RemoteJudgeType.Hdu;
    case "poj":
      return RemoteJudgeType.Poj;
    default:
      return RemoteJudgeType.DidaOJ;
  }
}
