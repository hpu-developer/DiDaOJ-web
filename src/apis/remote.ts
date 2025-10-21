export enum RemoteJudgeType {
  DidaOJ = 0,
  Hdu = 7,
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
    default:
      return RemoteJudgeType.DidaOJ;
  }
}
