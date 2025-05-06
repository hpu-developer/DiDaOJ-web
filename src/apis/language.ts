export enum JudgeLanguage {
  Unknown = -1,
  C = 0,
  Cpp = 1,
  Java = 2,
  Python = 3,
  Max,
}

export function GetSubmitLanguages() {
  return [
    {
      value: JudgeLanguage.C,
      label: "C",
    },
    {
      value: JudgeLanguage.Cpp,
      label: "C++",
    },
    {
      value: JudgeLanguage.Java,
      label: "Java",
    },
    {
      value: JudgeLanguage.Python,
      label: "Python",
    },
  ];
}

export function IsJudgeLanguageValid(language: number) {
  return language > JudgeLanguage.Unknown && language < JudgeLanguage.Max;
}

export function GetJudgeLanguageStr(language: JudgeLanguage) {
  switch (language) {
    case JudgeLanguage.C:
      return "C";
    case JudgeLanguage.Cpp:
      return "C++";
    case JudgeLanguage.Java:
      return "Java";
    case JudgeLanguage.Python:
      return "Python";
    default:
      return "Unknown";
  }
}

export function GetKeyByJudgeLanguage(language: JudgeLanguage) {
  switch (language) {
    case JudgeLanguage.C:
      return "c";
    case JudgeLanguage.Cpp:
      return "cpp";
    case JudgeLanguage.Java:
      return "java";
    case JudgeLanguage.Python:
      return "python";
    default:
      return "text";
  }
}
