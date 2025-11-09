import { GetRemoteJudgeTypeByStr, RemoteJudgeType } from "@/apis/remote.ts";

export enum JudgeLanguage {
  Unknown = -1,
  C = 0,
  Cpp = 1,
  Java = 2,
  Python = 3,
  Pascal = 4,
  Golang = 5,
  Lua = 6,
  TypeScript = 7,
  Max,
}

const languageMap: { [key in RemoteJudgeType]: JudgeLanguage[] } = {
  [RemoteJudgeType.Hdu]: [JudgeLanguage.C, JudgeLanguage.Cpp, JudgeLanguage.Java, JudgeLanguage.Pascal],
  [RemoteJudgeType.Poj]: [JudgeLanguage.C, JudgeLanguage.Cpp, JudgeLanguage.Java, JudgeLanguage.Pascal],
};

export function GetSubmitLanguages(oj?: string | undefined) {
  const exclude = [JudgeLanguage.Unknown, JudgeLanguage.Max]; // 不想包含的语言
  return Object.values(JudgeLanguage)
    .filter((v) => typeof v === "number" && !exclude.includes(v))
    .filter((value) => {
      if (oj === undefined) {
        return true;
      }
      const remoteType = GetRemoteJudgeTypeByStr(oj);
      const allowedLanguages = languageMap[remoteType];
      if (allowedLanguages === undefined) {
        return true;
      }
      return allowedLanguages.includes(value as JudgeLanguage);
    })
    .map((value) => ({
      value,
      label: GetJudgeLanguageStr(value as JudgeLanguage),
    })) as { label: string; value: JudgeLanguage | undefined }[];
}

export function IsJudgeLanguageValid(language: number) {
  return language > JudgeLanguage.Unknown && language < JudgeLanguage.Max;
}

export function GetJudgeLanguageStr(language: JudgeLanguage | undefined) {
  if (language === undefined) {
    return "未知";
  }
  switch (language) {
    case JudgeLanguage.C:
      return "C";
    case JudgeLanguage.Cpp:
      return "C++";
    case JudgeLanguage.Java:
      return "Java";
    case JudgeLanguage.Python:
      return "Python";
    case JudgeLanguage.Pascal:
      return "Pascal";
    case JudgeLanguage.Golang:
      return "Golang";
    case JudgeLanguage.Lua:
      return "Lua";
    case JudgeLanguage.TypeScript:
      return "TypeScript";
    default:
      return "未知";
  }
}

export function GetHighlightKeyByJudgeLanguage(language: JudgeLanguage) {
  switch (language) {
    case JudgeLanguage.C:
      return "c";
    case JudgeLanguage.Cpp:
      return "cpp";
    case JudgeLanguage.Java:
      return "java";
    case JudgeLanguage.Python:
      return "python";
    case JudgeLanguage.Pascal:
      return "pascal";
    case JudgeLanguage.Golang:
      return "go";
    case JudgeLanguage.Lua:
      return "lua";
    case JudgeLanguage.TypeScript:
      return "typescript";
    default:
      return "text";
  }
}
