export enum JudgeLanguage {
  Unknown = -1,
  C = 0,
  Cpp = 1,
  Java = 2,
  Python = 3,
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
