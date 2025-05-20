let remoteTextCache: Record<string, Record<string, string>> | null = null;

export async function ReinitTextCache() {
  remoteTextCache = await fetchRemoteText();
}

export function GetText(key: string | number, lang = "zh"): [boolean, string] {
  if (remoteTextCache == null) {
    return [false, key.toString()];
  }
  const stringConfig = remoteTextCache[key.toString()];
  if (!stringConfig) {
    return [false, key.toString()];
  }
  let value = stringConfig[lang];
  if (!value) {
    lang = "zh"; // 默认回退到中文
    value = stringConfig[lang];
  }
  if (!value) {
    return [false, key.toString()]; // 如果仍未找到，返回默认值
  }
  return [true, value];
}

async function fetchRemoteText(): Promise<Record<string, Record<string, string>> | null> {
  return new Promise((resolve, reject) => {
    resolve({
      "404": {
        zh: "接口未找到",
      },
      "1000": {
        zh: "系统错误",
      },
      "1002": {
        zh: "未知错误",
      },
      "10001": {
        zh: "权限异常，请重新登陆后再试",
      },
      "10002": {
        zh: "参数不符合要求",
      },
      "10003": {
        zh: "未找到目标数据",
      },
      "100001": {
        zh: "用户名不存在或密码不匹配",
      },
    });
  });
}
