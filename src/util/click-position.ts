/**
 * 点击位置工具函数
 * 用于记录用户的点击位置，并在指定时间后自动清除
 */

// 记录当前点击位置
let mousePosition: { x: number; y: number } | null = null;

/**
 * 记录点击位置
 * @param e 鼠标事件对象
 */
export const recordClickPosition = (e: Event): void => {
  const mouseEvent = e as MouseEvent;
  mousePosition = {
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
  };
  
  // 100ms 后清除点击位置
  setTimeout(() => {
    mousePosition = null;
  }, 100);
};

/**
 * 获取当前点击位置
 * @returns 点击位置坐标，如果没有记录则返回 null
 */
export const getCurrentClickPosition = (): { x: number; y: number } | null => {
  return mousePosition;
};

/**
 * 在指定的DOM元素上监听点击事件，记录点击位置
 * @param element 要监听的DOM元素，默认是document
 */
export const enableClickPositionTracking = (element: EventTarget = document): void => {
  element.addEventListener('click', recordClickPosition);
};

/**
 * 停止在指定的DOM元素上监听点击事件
 * @param element 要停止监听的DOM元素，默认是document
 */
export const disableClickPositionTracking = (element: EventTarget = document): void => {
  element.removeEventListener('click', recordClickPosition);
};