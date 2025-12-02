<template>
  <h1>五子棋对战</h1>
  <!-- 游戏信息显示 -->
  <div class="game-info">
    <div class="player-info">
      <div class="player black">
        <span class="stone black"></span>
        <span>黑方：{{ gameData.blackPlayer?.name || "黑棋" }}</span>
      </div>
      <div class="player white">
        <span class="stone white"></span>
        <span>白方：{{ gameData.whitePlayer?.name || "白棋" }}</span>
      </div>
    </div>
    <div class="game-status">
      <p v-if="gameData.result">结果：{{ gameData.result }}</p>
      <p>当前步数：{{ currentStep }} / {{ gameData.moves?.length || 0 }}</p>
    </div>
  </div>

  <!-- 棋盘Canvas -->
  <div class="board-container">
    <canvas ref="boardCanvas" :width="canvasWidth" :height="canvasHeight" class="go-board"></canvas>
  </div>

  <!-- 控制按钮 -->
  <div class="controls">
    <button @click="gotoStart" class="control-btn"><span>⏮️</span> 开始</button>
    <button @click="prevStep" class="control-btn"><span>⏪</span> 上一步</button>
    <button @click="togglePlay" class="control-btn primary">
      <span v-if="isPlaying">⏸️</span>
      <span v-else>▶️</span>
      {{ isPlaying ? "暂停" : "播放" }}
    </button>
    <button @click="nextStep" class="control-btn"><span>⏩</span> 下一步</button>
    <button @click="gotoEnd" class="control-btn"><span>⏭️</span> 结束</button>
    <div class="speed-control">
      <label>播放速度：</label>
      <input type="range" min="0.5" max="3" step="0.5" v-model="playSpeed" class="speed-slider" />
      <span>{{ playSpeed }}x</span>
    </div>
  </div>

  <!-- 落子记录 -->
  <div class="move-history">
    <h3>落子记录</h3>
    <div class="moves">
      <div
        v-for="(move, index) in gameData.moves"
        :key="index"
        :class="['move-item', { active: index === currentStep - 1 }]"
        @click="gotoStep(index + 1)"
      >
        <span class="move-number">{{ index + 1 }}</span>
        <span class="stone" :class="move.color"></span>
        <span class="move-position">{{ formatPosition(move.x, move.y) }}</span>
        <span class="timestamp" v-if="move.time">{{ formatTime(move.time) }}</span>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";

// 定义数据结构
interface Player {
  id: string;
  name: string;
  type?: string; // 'human' or 'bot'
}

interface Move {
  x: number; // x坐标（0-14）
  y: number; // y坐标（0-14）
  color: "black" | "white";
  time?: number; // 落子用时（毫秒）
}

interface GameData {
  id: string;
  boardSize: number; // 通常是15
  startTime?: number;
  endTime?: number;
  blackPlayer: Player;
  whitePlayer: Player;
  moves: Move[];
  result?: string; // 游戏结果描述
  winner?: "black" | "white" | "draw";
  winningLine?: { x1: number; y1: number; x2: number; y2: number }[]; // 获胜的棋子连线
}

// 定义从父组件接收的数据结构
interface ParentGameData {
  id: string;
  paramData?: any;
  infoData?: any;
  botStatus?: any;
  [key: string]: any;
}

// Props
const props = defineProps<{
  gameData: ParentGameData;
}>();

// Emits
const emit = defineEmits<{
  (e: "update:gameData", value: ParentGameData): void;
}>();

// 五子棋游戏的内部数据
const internalGameData = ref<GameData>({
  id: "demo-game-1",
  boardSize: 15,
  startTime: Date.now() - 3600000,
  blackPlayer: {
    id: "player1",
    name: "黑方选手",
    type: "bot",
  },
  whitePlayer: {
    id: "player2",
    name: "白方选手",
    type: "bot",
  },
  moves: [
      { x: 7, y: 7, color: "black", time: 120 },
      { x: 8, y: 8, color: "white", time: 150 },
      { x: 6, y: 6, color: "black", time: 90 },
      { x: 9, y: 9, color: "white", time: 200 },
      { x: 5, y: 5, color: "black", time: 130 },
      { x: 10, y: 10, color: "white", time: 170 },
      { x: 4, y: 4, color: "black", time: 100 },
    ],
  result: "游戏进行中",
});

// 组件状态
const boardCanvas = ref<HTMLCanvasElement>();
const canvasWidth = ref(600);
const canvasHeight = ref(600);
const currentStep = ref(0);
const isPlaying = ref(false);
const playSpeed = ref(1);
let animationFrameId: number | null = null;
let lastPlayTime = 0;
let lastBlinkTime = 0;
const blinkIntensity = ref(1); // 闪烁强度 (0-1)

// 动画相关状态
const dropAnimationProgress = ref(0); // 落子动画进度 (0-1)
const lineAnimationProgress = ref(0); // 胜利连线动画进度 (0-1)
const isDropAnimating = ref(false); // 是否正在进行落子动画
const isLineAnimating = ref(false); // 是否正在进行连线动画
let animationStartTime = 0;
const DROP_ANIMATION_DURATION = 300; // 落子动画持续时间（毫秒）
const LINE_ANIMATION_DURATION = 800; // 连线动画持续时间（毫秒）

// 格式化坐标显示
function formatPosition(x: number, y: number): string {
  const colLetters = "ABCDEFGHJKLMNOPQRST"; // 五子棋棋盘通常不用I
  return `${colLetters[x]}${y + 1}`;
}

// 格式化时间 - 显示用时（毫秒）
function formatTime(time: number): string {
  return `${time}ms`;
}

// 绘制棋盘
function drawBoard(): void {
  if (!boardCanvas.value) {
    console.error("boardCanvas 元素不存在");
    return;
  }

  const ctx = boardCanvas.value.getContext("2d");
  if (!ctx) {
    console.error("无法获取 2D 上下文");
    return;
  }

  const size = internalGameData.value.boardSize;
  // 计算每个格子的大小，减去行列号占用的空间
  const labelSize = 25; // 行列号标签的大小
  const cellSize = Math.min((canvasWidth.value - labelSize) / size, (canvasHeight.value - labelSize) / size);
  const offsetX = labelSize; // 调整X轴偏移量，留出列号空间
  const offsetY = labelSize; // 调整Y轴偏移量，留出行号空间

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // 设置背景色
  ctx.fillStyle = "#E8C095"; // 棋盘木色
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

  // 设置字体样式用于绘制行列号
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";

  // 绘制列号（A-T，跳过I）
  const colLetters = "ABCDEFGHJKLMNOPQRST"; // 五子棋棋盘通常不用I
  for (let i = 0; i < size; i++) {
    const x = offsetX + i * cellSize;
    const y = labelSize / 2;
    ctx.fillText(colLetters[i], x, y);
  }

  // 绘制行号（1-15）
  for (let i = 0; i < size; i++) {
    const x = labelSize / 2;
    const y = offsetY + i * cellSize;
    ctx.fillText((i + 1).toString(), x, y);
  }

  // 绘制网格线
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  for (let i = 0; i < size; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + i * cellSize);
    ctx.lineTo(offsetX + (size - 1) * cellSize, offsetY + i * cellSize);
    ctx.stroke();

    // 竖线
    ctx.beginPath();
    ctx.moveTo(offsetX + i * cellSize, offsetY);
    ctx.lineTo(offsetX + i * cellSize, offsetY + (size - 1) * cellSize);
    ctx.stroke();
  }

  // 绘制天元和星位
  const starPoints = [
    { x: 3, y: 3 },
    { x: 3, y: size - 4 },
    { x: Math.floor((size - 1) / 2), y: Math.floor((size - 1) / 2) }, // 天元
    { x: size - 4, y: 3 },
    { x: size - 4, y: size - 4 },
  ];

  ctx.fillStyle = "#000000";
  starPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(offsetX + point.x * cellSize, offsetY + point.y * cellSize, cellSize / 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // 绘制棋子
  drawStones();
}

// 绘制棋子
function drawStones(): void {
  if (!boardCanvas.value) return;

  const ctx = boardCanvas.value.getContext("2d");
  if (!ctx) return;

  const size = internalGameData.value.boardSize;
  // 使用与drawBoard函数相同的计算方式
  const labelSize = 25; // 行列号标签的大小
  const cellSize = Math.min((canvasWidth.value - labelSize) / size, (canvasHeight.value - labelSize) / size);
  const offsetX = labelSize; // 调整X轴偏移量，与棋盘对齐
  const offsetY = labelSize; // 调整Y轴偏移量，与棋盘对齐
  const stoneRadius = cellSize * 0.45;

  // 绘制到当前步骤的所有棋子
  for (let i = 0; i < currentStep.value && i < internalGameData.value.moves.length; i++) {
    const move = internalGameData.value.moves[i];
    const x = offsetX + move.x * cellSize;
    const y = offsetY + move.y * cellSize;

    // 计算当前棋子的半径（考虑落子动画）
    let currentRadius = stoneRadius;
    let currentAlpha = 1;

    // 如果是当前步骤的棋子且正在进行落子动画，应用动画效果
    if (i === currentStep.value - 1 && isDropAnimating.value) {
      // 计算动画进度对应的缩放比例（使用缓动函数）
      const easeOut = 1 - Math.pow(1 - dropAnimationProgress.value, 3); // 缓出效果
      currentRadius = stoneRadius * easeOut;
      currentAlpha = easeOut;

      // 添加落子特效（波纹效果）
      const rippleRadius = stoneRadius * (1.5 + easeOut * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 * (1 - easeOut)})`; // 金色波纹，逐渐消失
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 绘制棋子
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);

    if (move.color === "black") {
      // 黑色棋子带渐变效果
      const gradient = ctx.createRadialGradient(x - currentRadius * 0.3, y - currentRadius * 0.3, 0, x, y, currentRadius);
      gradient.addColorStop(0, "#666666");
      gradient.addColorStop(1, "#000000");
      ctx.fillStyle = gradient;
    } else {
      // 白色棋子带渐变效果
      const gradient = ctx.createRadialGradient(x - currentRadius * 0.3, y - currentRadius * 0.3, 0, x, y, currentRadius);
      gradient.addColorStop(0, "#FFFFFF");
      gradient.addColorStop(1, "#CCCCCC");
      ctx.fillStyle = gradient;
    }

    // 设置透明度（用于动画）
    ctx.globalAlpha = currentAlpha;
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1; // 重置透明度

    // 如果是最后一步（当前步骤落下的棋子），添加明显的特殊标记
    if (i === currentStep.value - 1) {
      // 根据闪烁强度计算边框颜色的透明度
      const alpha = 0.7 + 0.3 * blinkIntensity.value;
      const borderColor = `rgba(255, 0, 0, ${alpha})`; // 红色边框，带透明度变化
      const shadowBlur = 5 + 10 * blinkIntensity.value;

      // 1. 首先绘制一个醒目的外框
      ctx.beginPath();
      ctx.arc(x, y, currentRadius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 2. 添加内部标记点
      ctx.beginPath();
      ctx.arc(x, y, currentRadius / 4, 0, Math.PI * 2);
      ctx.fillStyle = move.color === "black" ? "#FFFFFF" : "#000000";
      ctx.fill();

      // 3. 添加动态阴影效果
      ctx.shadowColor = `rgba(255, 215, 0, ${alpha})`; // 金色阴影，带透明度变化
      ctx.shadowBlur = shadowBlur;
    } else {
      // 确保其他棋子没有阴影效果
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }

  // 检查是否有获胜情况，并绘制获胜连线
  const { winner, winningLine } = evaluateBoard(size, internalGameData.value.moves, currentStep.value);
  
  // 绘制获胜连线（如果有）
  if (winner && winningLine) {
    // 绘制获胜连线
    ctx.strokeStyle = "#FF0000"; // 红色连线
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const line of winningLine) {
      const startX = offsetX + line.x1 * cellSize;
      const startY = offsetY + line.y1 * cellSize;
      const endX = offsetX + line.x2 * cellSize;
      const endY = offsetY + line.y2 * cellSize;

      // 如果正在进行连线动画，应用动画效果
      if (isLineAnimating.value) {
        // 计算动画进度对应的线段长度
        const easeOut = 1 - Math.pow(1 - lineAnimationProgress.value, 2); // 缓出效果

        // 计算当前应该绘制到的点
        const currentEndX = startX + (endX - startX) * easeOut;
        const currentEndY = startY + (endY - startY) * easeOut;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.stroke();

        // 添加连线动画的发光效果
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 10 * easeOut;
        ctx.beginPath();
        ctx.arc(currentEndX, currentEndY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#FF0000";
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // 正常绘制完整连线
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    // 重置阴影效果
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }
}

// 控制函数
function gotoStep(step: number): void {
  // 保存之前的步骤，用于判断是否需要动画
  const prevStep = currentStep.value;
  currentStep.value = Math.max(0, Math.min(step, internalGameData.value.moves.length));

  // 更新游戏状态
  updateGameStatus();

  // 只有当步骤发生变化且不是后退时，才触发落子动画
  if (currentStep.value > prevStep && currentStep.value <= internalGameData.value.moves.length) {
    // 检查是否到达胜利步骤
    const { winner } = evaluateBoard(internalGameData.value.boardSize, internalGameData.value.moves, currentStep.value);
    if (winner && !props.gameData.winner) {
      // 如果刚到达胜利步骤，启动连线动画
      startLineAnimation();
    } else {
      // 否则启动落子动画
      startDropAnimation();
    }
  } else {
    // 后退或无变化时直接重绘
    drawBoard();
  }
}

// 启动落子动画
function startDropAnimation() {
  isDropAnimating.value = true;
  dropAnimationProgress.value = 0;
  animationStartTime = Date.now();

  // 动画循环
  function animateDrop() {
    const elapsed = Date.now() - animationStartTime;
    dropAnimationProgress.value = Math.min(elapsed / DROP_ANIMATION_DURATION, 1);

    drawBoard();

    if (dropAnimationProgress.value < 1) {
      requestAnimationFrame(animateDrop);
    } else {
      isDropAnimating.value = false;
    }
  }

  animateDrop();
}

// 启动胜利连线动画
function startLineAnimation() {
  isLineAnimating.value = true;
  lineAnimationProgress.value = 0;
  animationStartTime = Date.now();

  // 动画循环
  function animateLine() {
    const elapsed = Date.now() - animationStartTime;
    lineAnimationProgress.value = Math.min(elapsed / LINE_ANIMATION_DURATION, 1);

    drawBoard();

    if (lineAnimationProgress.value < 1) {
      requestAnimationFrame(animateLine);
    } else {
      isLineAnimating.value = false;
    }
  }

  animateLine();
}

function gotoStart(): void {
  gotoStep(0);
}

function gotoEnd(): void {
  gotoStep(props.gameData.moves.length);
}

function prevStep(): void {
  gotoStep(currentStep.value - 1);
}

function nextStep(): void {
  gotoStep(currentStep.value + 1);
}

function togglePlay(): void {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    lastPlayTime = Date.now();
    playAnimation();
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function playAnimation(): void {
  if (!isPlaying.value) return;

  const now = Date.now();
  const timeDiff = now - lastPlayTime;
  const stepInterval = 1000 / playSpeed.value;

  // 只有当没有正在进行的动画时，才进行步骤切换
  if (timeDiff >= stepInterval && !isDropAnimating.value && !isLineAnimating.value) {
    if (currentStep.value < internalGameData.value.moves.length) {
      nextStep();
      lastPlayTime = now;
    } else {
      isPlaying.value = false;
      return;
    }
  }

  animationFrameId = requestAnimationFrame(playAnimation);
}

// 检查指定位置是否有五连子
function checkWinning(
  board: Map<string, "black" | "white">,
  x: number,
  y: number,
  color: "black" | "white",
  size: number
): { x1: number; y1: number; x2: number; y2: number }[] | null {
  // 检查方向：横向、纵向、对角线1、对角线2
  const directions = [
    { dx: 1, dy: 0 }, // 横向
    { dx: 0, dy: 1 }, // 纵向
    { dx: 1, dy: 1 }, // 对角线1
    { dx: 1, dy: -1 }, // 对角线2
  ];

  for (const dir of directions) {
    let count = 1; // 包含当前位置
    let startX = x;
    let startY = y;
    let endX = x;
    let endY = y;

    // 向正方向检查
    for (let i = 1; i < 5; i++) {
      const nx = x + dir.dx * i;
      const ny = y + dir.dy * i;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && board.get(`${nx},${ny}`) === color) {
        count++;
        endX = nx;
        endY = ny;
      } else {
        break;
      }
    }

    // 向反方向检查
    for (let i = 1; i < 5; i++) {
      const nx = x - dir.dx * i;
      const ny = y - dir.dy * i;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && board.get(`${nx},${ny}`) === color) {
        count++;
        startX = nx;
        startY = ny;
      } else {
        break;
      }
    }

    // 如果有五连子，返回连线的起始和结束位置
    if (count >= 5) {
      return [{ x1: startX, y1: startY, x2: endX, y2: endY }];
    }
  }

  return null;
}

// 根据当前局面判断胜负
function evaluateBoard(
  boardSize: number,
  moves: Move[],
  currentStep: number
): { winner: "black" | "white" | null; winningLine: { x1: number; y1: number; x2: number; y2: number }[] | null } {
  // 创建棋盘映射
  const board = new Map<string, "black" | "white">();

  // 只添加当前步骤之前的棋子
  for (let i = 0; i < currentStep && i < moves.length; i++) {
    const move = moves[i];
    board.set(`${move.x},${move.y}`, move.color);
  }

  // 检查每个棋子是否形成五连子
  for (let i = 0; i < currentStep && i < moves.length; i++) {
    const move = moves[i];
    const winningLine = checkWinning(board, move.x, move.y, move.color, boardSize);
    if (winningLine) {
      return { winner: move.color, winningLine };
    }
  }

  // 检查是否平局（棋盘已满）
  if (currentStep >= boardSize * boardSize) {
    return { winner: null, winningLine: null };
  }

  return { winner: null, winningLine: null };
}

// 监听步骤变化，重置闪烁效果
watch(currentStep, () => {
  // 重置闪烁效果
  blinkIntensity.value = 1;
  lastBlinkTime = Date.now();
});

// 监听父组件传递的游戏数据变化
watch(
  () => props.gameData,
  (newData) => {
    if (newData.paramData && newData.infoData) {
      // 从父组件传递的数据中提取游戏信息

      // 处理移动数据
      if (newData.paramData.moves && Array.isArray(newData.paramData.moves)) {
        internalGameData.value.moves = newData.paramData.moves.map((move: any, index: number) => ({
          x: move.x,
          y: move.y,
          color: index % 2 === 0 ? "black" : "white",
          time: move.time, // 直接使用服务器返回的用时
        }));
      }

      // 处理玩家信息 - 确保正确读取infoData中的black和white字段
      if (newData.infoData.black) {
        internalGameData.value.blackPlayer = {
          id: newData.infoData.black.id.toString(),
          name: newData.infoData.black.nickname || newData.infoData.black.name || "黑方",
          type: "bot",
        };
      }
      if (newData.infoData.white) {
        internalGameData.value.whitePlayer = {
          id: newData.infoData.white.id.toString(),
          name: newData.infoData.white.nickname || newData.infoData.white.name || "白方",
          type: "bot",
        };
      }

      // 重置当前步骤并重新绘制
      currentStep.value = 0;
      drawBoard();
    }
  },
  { deep: true }
);

// 监听内部游戏数据变化，更新父组件
watch(
  () => internalGameData.value,
  (newData) => {
    // 将内部游戏数据包装后传递给父组件
    emit("update:gameData", {
      ...props.gameData,
      moves: newData.moves,
      result: newData.result,
      winner: newData.winner,
      winningLine: newData.winningLine,
    });
  },
  { deep: true }
);

// 从evaluateBoard函数中分离游戏状态更新逻辑
function updateGameStatus() {
  const size = internalGameData.value.boardSize;
  const { winner, winningLine } = evaluateBoard(size, internalGameData.value.moves, currentStep.value);
  
  let needsUpdate = false;
  const updatedGameData = { ...internalGameData.value };
  
  if (winner) {
    if (updatedGameData.winner !== winner) {
      updatedGameData.winner = winner;
      updatedGameData.result = winner === "black" ? "黑方胜利" : "白方胜利";
      updatedGameData.winningLine = winningLine;
      needsUpdate = true;
    }
  } else if (currentStep.value >= size * size) {
    // 平局情况
    if (updatedGameData.result !== "平局") {
      updatedGameData.result = "平局";
      updatedGameData.winner = "draw";
      needsUpdate = true;
    }
  } else {
    // 游戏未结束
    if (updatedGameData.result !== "游戏进行中") {
      updatedGameData.result = "游戏进行中";
      updatedGameData.winner = undefined;
      updatedGameData.winningLine = undefined;
      needsUpdate = true;
    }
  }
  
  if (needsUpdate) {
    internalGameData.value = updatedGameData;
  }
}

// 组件挂载时初始化
  onMounted(() => {
    drawBoard();
    lastBlinkTime = Date.now();
    
    // 更新游戏状态
    updateGameStatus();

    // 启动闪烁动画
    function animateBlink() {
      // 检查boardCanvas是否存在，不存在则停止动画
      if (!boardCanvas.value) {
        return;
      }
      
      const now = Date.now();
      const timeDiff = now - lastBlinkTime;
      const blinkPeriod = 1000; // 闪烁周期（毫秒）

      // 计算闪烁强度 - 使用正弦波创建平滑的闪烁效果
      blinkIntensity.value = 0.5 + 0.5 * Math.sin((timeDiff * Math.PI * 2) / blinkPeriod);

      // 只有当有当前步骤且不是在播放状态时，才重绘以显示闪烁效果
      if (currentStep.value >= 0 && !isPlaying.value) {
        drawBoard();
      }

      animationFrameId = requestAnimationFrame(animateBlink);
    }

    animateBlink();

    // 响应式调整画布大小
    const handleResize = () => {
      // 检查boardCanvas是否存在
      if (!boardCanvas.value) return;
      
      const container = boardCanvas.value.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const size = Math.min(containerWidth, containerHeight);
        
        // 避免不必要的更新
        if (canvasWidth.value !== size || canvasHeight.value !== size) {
          canvasWidth.value = size;
          canvasHeight.value = size;
          drawBoard();
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // 组件卸载时清理
    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });
  });
</script>

<style scoped>
.gomoku-game {
  font-family: Arial, sans-serif;
}

.game-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.player-info {
  display: flex;
  gap: 20px;
}

.player {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.stone {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #333;
}

.stone.black {
  background-color: #000;
}

.stone.white {
  background-color: #fff;
}

.board-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.go-board {
  border: 2px solid #8b4513;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background-color: #f0f0f0;
}

.control-btn.primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.control-btn.primary:hover {
  background-color: #66b1ff;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 15px;
}

.speed-slider {
  width: 100px;
}

.move-history {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
}

.move-history h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 10px;
}

.moves {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.move-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.move-item:hover {
  background-color: #f0f0f0;
}

.move-item.active {
  background-color: #e3f2fd;
  font-weight: 500;
}

.move-number {
  font-size: 12px;
  color: #666;
  width: 20px;
  text-align: right;
}

.move-position {
  font-weight: 500;
}

.move-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

@media (max-width: 768px) {
  .game-info {
    flex-direction: column;
    gap: 10px;
  }

  .player-info {
    justify-content: center;
  }

  .game-status {
    text-align: center;
  }

  .moves {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
