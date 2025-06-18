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
  return new Promise((resolve) => {
    resolve({
      "404": {
        zh: "接口未找到",
      },
      "1000": {
        zh: "系统错误，请重试或等待管理员修复",
      },
      "1001": {
        zh: "系统异常，请重试或等待管理员修复",
      },
      "1002": {
        zh: "未知错误",
      },
      "1003": {
        zh: "操作过于频繁，请稍后重试",
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
      "10004": {
        zh: "操作需要登录，请登录后重试",
      },
      "100001": {
        zh: "用户名不存在或密码不匹配",
      },
      "100002": {
        zh: "邮件发送失败，可能是邮箱无效或达到了每日注册上限，如有问题可联系管理员解决",
      },
      "100003": {
        zh: "验证码错误或已过期，请重新获取",
      },
      "100004": {
        zh: "注册用户失败，可能存在同名用户",
      },
      "100005": {
        zh: "用户名不存在，或您未在本系统绑定邮箱，请联系管理员寻求帮助",
      },
      "100006": {
        zh: "验证码错误或已过期，请重新获取",
      },
      "100007": {
        zh: "已存在相同标题的题目",
      },
      "100008": {
        zh: "已存在相同标题的比赛",
      },
      "100009": {
        zh: "已存在相同标题的题集",
      },
      "100010": {
        zh: "未发现有效题目",
      },
      "100011": {
        zh: "题目数量超过限制，无法添加",
      },
      "100012": {
        zh: "比赛开始时间无法设置为早于当前时间",
      },
      "100013": {
        zh: "当前无法提交题目",
      },
      "100014": {
        zh: "申请访问失败，密码错误",
      },
      "100015": {
        zh: "未找到目标题目",
      },
      "100016": {
        zh: "已经存在该日期或问题的条目",
      },
    });
  });
}
