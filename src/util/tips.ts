import { GetText } from "@/text/library.ts";

import type { ComponentCustomProperties } from "vue";

export function GetCommonErrorCode() {
  return 1000;
}

export function ShowTextTipsSuccess(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.success({
    duration,
    content: tips,
  });
}

export function ShowTextTipsInfo(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.info({
    duration,
    content: tips,
  });
}

export function ShowTextTipsWarn(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.warn({
    duration,
    content: tips,
  });
}

export function ShowTextTipsError(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.error({
    duration,
    content: tips,
  });
}

export function ShowErrorTips(properties: ComponentCustomProperties & Record<string, any>, tips: number | string, duration = 3000) {
  const [found, realTips] = GetText(tips);
  const message = found ? realTips : `系统错误，错误提示[${realTips}]`;

  return properties.$message.error({
    duration,
    content: message,
  });
}

export function ShowErrorParamTips(
  properties: ComponentCustomProperties & Record<string, any>,
  tips: number | string,
  params: Record<string, string> | null = null,
  duration = 3000,
) {
  let message = "";
  const [found, realTips] = GetText(tips);
  if (found) {
    if (params) {
      message = realTips.replace(/\{(\w+)\}/g, (match, key) => {
        const value = params[key];
        if (value) {
          const [foundValue, realValue] = GetText(value);
          return foundValue ? realValue : value; // 如果找不到对应的文本，直接返回原值
        }
        return match;
      });
    } else {
      message = realTips;
    }
  } else {
    // 判断realTips能不能转为Number
    const realTipsNumber = Number(realTips);
    if (!isNaN(realTipsNumber)) {
      message = `系统错误，错误码[${realTipsNumber}]`;
    } else {
      message = `${realTips}`;
    }
  }
  return properties.$message.error({
    duration,
    content: message,
  });
}

export function ShowTextTipsBottomLeft(properties: ComponentCustomProperties & Record<string, any>, tips: string, duration = 3000) {
  return properties.$message.success({
    duration,
    content: tips,
    placement: "bottom-left",
  });
}

/**
 * 增强版经验提醒函数（绿色主题）
 * @param properties 组件属性
 * @param expValue 经验值
 * @param duration 显示时长
 * @param customContent 自定义内容（可选），支持string或TNode类型
 */
export function ShowEnhancedExpTips(
  properties: ComponentCustomProperties & Record<string, any>, 
  expValue: number = 20,
  duration = 4000,
  customContent?: string | ((h: any) => any)
) {
  // 添加简单的动画样式到页面
  addAnimationStyle();
  
  // 创建TNode函数来渲染HTML内容
  const renderContent = (h: any) => {
    // 如果提供了自定义内容函数，使用它
    if (typeof customContent === 'function') {
      return customContent(h);
    }
    // 如果提供了自定义字符串内容，创建一个简单的元素
    if (typeof customContent === 'string') {
      return h('div', {}, [customContent]);
    }
    // 默认渲染绿色主题的经验提示，只显示经验和数值
    return h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }
    }, [
      h('span', {
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#00b42a'
        }
      }, ['✨']),
      h('div', {
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#00b42a',
          animation: 'pulse 1.5s infinite'
        }
      }, ['经验 + ' + expValue])
    ]);
  };
  
  return properties.$message.info({
    duration,
    content: renderContent, // 使用TNode函数渲染内容
    placement: "top-right",
    closeBtn: false,
    offset: 20,
    showIcon: false,
    theme: "gradient",
    className: "enhanced-exp-tips"
  });
}

/**
 * 增强版金币提醒函数（黄色主题）
 * @param properties 组件属性
 * @param coinValue 金币值
 * @param duration 显示时长
 * @param customContent 自定义内容（可选），支持string或TNode类型
 */
export function ShowEnhancedCoinTips(
  properties: ComponentCustomProperties & Record<string, any>, 
  coinValue: number = 1,
  duration = 4000,
  customContent?: string | ((h: any) => any)
) {
  // 添加简单的动画样式到页面
  addAnimationStyle();
  
  // 创建TNode函数来渲染HTML内容
  const renderContent = (h: any) => {
    // 如果提供了自定义内容函数，使用它
    if (typeof customContent === 'function') {
      return customContent(h);
    }
    // 如果提供了自定义字符串内容，创建一个简单的元素
    if (typeof customContent === 'string') {
      return h('div', {}, [customContent]);
    }
    // 默认渲染黄色主题的金币提示，只显示金币和数值
    return h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }
    }, [
      h('span', {
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fa8c16'
        }
      }, ['💰']),
      h('div', {
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fa8c16',
          animation: 'pulse 1.5s infinite'
        }
      }, ['金币 + ' + coinValue])
    ]);
  };
  
  return properties.$message.info({
    duration,
    content: renderContent, // 使用TNode函数渲染内容
    placement: "top-right",
    closeBtn: false,
    offset: 20,
    showIcon: false,
    theme: "gradient",
    className: "enhanced-coin-tips"
  });
}

/**
 * 增强版奖励提醒函数（通用接口）
 * @param properties 组件属性
 * @param award 奖励对象，包含coin和experience字段
 * @param duration 显示时长
 */
export function ShowEnhancedAwardTips(
  properties: ComponentCustomProperties & Record<string, any>, 
  award: { coin?: number; experience?: number },
  duration = 4000
) {
  // 先处理经验提示
  if (award.experience && award.experience > 0) {
    ShowEnhancedExpTips(properties, award.experience, duration);
  }

  // 再处理金币提示
  if (award.coin && award.coin > 0) {
    ShowEnhancedCoinTips(properties, award.coin, duration);
  }
}

// 添加动画样式的辅助函数
function addAnimationStyle() {
  if (!document.getElementById('enhanced-exp-animation-style')) {
    const style = document.createElement('style');
    style.id = 'enhanced-exp-animation-style';
    style.textContent = 
      '@keyframes pulse {' +
      '  0% {' +
      '    transform: scale(1);' +
      '    opacity: 1;' +
      '  }' +
      '  50% {' +
      '    transform: scale(1.1);' +
      '    opacity: 0.8;' +
      '  }' +
      '  100% {' +
      '    transform: scale(1);' +
      '    opacity: 1;' +
      '  }' +
      '}' +
      '.enhanced-exp-tips {' +
      '  background: linear-gradient(135deg, #e6f7ee 0%, #f6ffed 100%);' +
      '  border: 1px solid #b7eb8f;' +
      '  box-shadow: 0 4px 12px rgba(0, 180, 42, 0.15);' +
      '  margin-bottom: 10px;' +
      '  font-size: 16px;' +
      '  padding: 12px 16px;' +
      '  border-radius: 8px;' +
      '}' +
      '.enhanced-coin-tips {' +
      '  background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%);' +
      '  border: 1px solid #ffe58f;' +
      '  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.15);' +
      '  margin-bottom: 10px;' +
      '  font-size: 16px;' +
      '  padding: 12px 16px;' +
      '  border-radius: 8px;' +
      '}';
    document.head.appendChild(style);
  }
}

export function CloseTips(properties: ComponentCustomProperties & Record<string, any>, tip: any) {
  if (properties.$message) {
    properties.$message.close(tip);
  }
}

// 计算省略文本
// 计算省略文本：英文与英文标点算 0.5，其他算 1
export function GetEllipsisText(text: string, maxLen: number) {
  let curLen = 0;
  let result = "";
  for (const ch of text) {
    const isAscii = ch.charCodeAt(0) <= 127;
    const charLen = isAscii ? 0.5 : 1;
    if (curLen + charLen > maxLen) {
      break;
    }
    result += ch;
    curLen += charLen;
  }
  if (result.length === text.length) {
    return result;
  }
  return result + "...";
}

export function formatDate(date: Date | string | number): string {
  date = new Date(date);
  const pad = (n: any) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 月份从0开始
  const day = pad(date.getDate());

  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

export function SplitIdStringsFromText(text: string): string[] {
  const problemSplits = text.trim().split(/\s+/); // 相当于 strings.Fields
  const problemList = problemSplits.flatMap((problem) => problem.split(","));
  return problemList.filter((item) => item.trim() !== "");
}

export function SplitIdNumbersFromText(text: string): number[] {
  return SplitIdStringsFromText(text)
    .filter((item) => !isNaN(Number(item)))
    .map((item) => Number(item));
}
