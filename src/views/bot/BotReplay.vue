<template>
  <div class="bot-replay-container">
    <h1>五子棋对战回放</h1>
    
    <!-- 游戏信息显示 -->
    <div class="game-info">
      <div class="player-info">
        <div class="player black">
          <span class="stone black"></span>
          <span>黑方：{{ gameData.blackPlayer.name || '黑棋' }}</span>
        </div>
        <div class="player white">
          <span class="stone white"></span>
          <span>白方：{{ gameData.whitePlayer.name || '白棋' }}</span>
        </div>
      </div>
      <div class="game-status">
        <p v-if="gameData.result">结果：{{ gameData.result }}</p>
        <p>当前步数：{{ currentStep }} / {{ gameData.moves.length }}</p>
      </div>
    </div>

    <!-- 棋盘Canvas -->
    <div class="board-container">
      <canvas 
        ref="boardCanvas" 
        :width="canvasWidth" 
        :height="canvasHeight"
        class="go-board"
      ></canvas>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button @click="gotoStart" class="control-btn">
        <span>⏮️</span> 开始
      </button>
      <button @click="prevStep" class="control-btn">
        <span>⏪</span> 上一步
      </button>
      <button @click="togglePlay" class="control-btn primary">
        <span v-if="isPlaying">⏸️</span>
        <span v-else>▶️</span>
        {{ isPlaying ? '暂停' : '播放' }}
      </button>
      <button @click="nextStep" class="control-btn">
        <span>⏩</span> 下一步
      </button>
      <button @click="gotoEnd" class="control-btn">
        <span>⏭️</span> 结束
      </button>
      <div class="speed-control">
        <label>播放速度：</label>
        <input 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.5" 
          v-model="playSpeed"
          class="speed-slider"
        >
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
          <span class="move-time" v-if="move.timestamp">{{ formatTime(move.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';

// 定义数据结构
interface Player {
  id: string;
  name: string;
  type?: string; // 'human' or 'bot'
}

interface Move {
  x: number;      // x坐标（0-14）
  y: number;      // y坐标（0-14）
  color: 'black' | 'white';
  timestamp?: number; // 落子时间戳
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
  winner?: 'black' | 'white' | 'draw';
}

// 组件状态
const boardCanvas = ref<HTMLCanvasElement>();
const canvasWidth = ref(600);
const canvasHeight = ref(600);
const currentStep = ref(0);
const isPlaying = ref(false);
const playSpeed = ref(1);
let animationFrameId: number | null = null;
let lastPlayTime = 0;

// 默认游戏数据（用于演示）
const gameData = ref<GameData>({
  id: 'demo-game-1',
  boardSize: 15,
  startTime: Date.now() - 3600000,
  blackPlayer: {
    id: 'player1',
    name: '黑方选手'
  },
  whitePlayer: {
    id: 'player2',
    name: '白方选手'
  },
  moves: [
    { x: 7, y: 7, color: 'black', timestamp: Date.now() - 3500000 },
    { x: 8, y: 8, color: 'white', timestamp: Date.now() - 3400000 },
    { x: 6, y: 6, color: 'black', timestamp: Date.now() - 3300000 },
    { x: 9, y: 9, color: 'white', timestamp: Date.now() - 3200000 },
    { x: 5, y: 5, color: 'black', timestamp: Date.now() - 3100000 },
    { x: 10, y: 10, color: 'white', timestamp: Date.now() - 3000000 },
    { x: 4, y: 4, color: 'black', timestamp: Date.now() - 2900000 },
  ],
  result: '黑方胜利'
});

// 格式化坐标显示
function formatPosition(x: number, y: number): string {
  const colLetters = 'ABCDEFGHJKLMNOPQRST'; // 五子棋棋盘通常不用I
  return `${colLetters[x]}${y + 1}`;
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

// 绘制棋盘
function drawBoard(): void {
  if (!boardCanvas.value) return;
  
  const ctx = boardCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const size = gameData.value.boardSize;
  const cellSize = Math.min(canvasWidth.value / (size + 1), canvasHeight.value / (size + 1));
  const offsetX = cellSize;
  const offsetY = cellSize;
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 设置背景色
  ctx.fillStyle = '#E8C095'; // 棋盘木色
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 绘制网格线
  ctx.strokeStyle = '#000000';
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
    { x: size - 4, y: size - 4 }
  ];
  
  ctx.fillStyle = '#000000';
  starPoints.forEach(point => {
    ctx.beginPath();
    ctx.arc(
      offsetX + point.x * cellSize,
      offsetY + point.y * cellSize,
      cellSize / 8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  
  // 绘制棋子
  drawStones();
}

// 绘制棋子
function drawStones(): void {
  if (!boardCanvas.value) return;
  
  const ctx = boardCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const size = gameData.value.boardSize;
  const cellSize = Math.min(canvasWidth.value / (size + 1), canvasHeight.value / (size + 1));
  const offsetX = cellSize;
  const offsetY = cellSize;
  const stoneRadius = cellSize * 0.45;
  
  // 绘制到当前步骤的所有棋子
  for (let i = 0; i < currentStep.value && i < gameData.value.moves.length; i++) {
    const move = gameData.value.moves[i];
    const x = offsetX + move.x * cellSize;
    const y = offsetY + move.y * cellSize;
    
    // 绘制棋子
    ctx.beginPath();
    ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
    
    if (move.color === 'black') {
      // 黑色棋子带渐变效果
      const gradient = ctx.createRadialGradient(
        x - stoneRadius * 0.3, y - stoneRadius * 0.3, 0,
        x, y, stoneRadius
      );
      gradient.addColorStop(0, '#666666');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
    } else {
      // 白色棋子带渐变效果
      const gradient = ctx.createRadialGradient(
        x - stoneRadius * 0.3, y - stoneRadius * 0.3, 0,
        x, y, stoneRadius
      );
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, '#CCCCCC');
      ctx.fillStyle = gradient;
    }
    
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 如果是最后一步，标记出来
    if (i === currentStep.value - 1) {
      ctx.beginPath();
      ctx.arc(x, y, stoneRadius / 5, 0, Math.PI * 2);
      ctx.fillStyle = move.color === 'black' ? '#FFFFFF' : '#000000';
      ctx.fill();
    }
  }
}

// 控制函数
function gotoStep(step: number): void {
  currentStep.value = Math.max(0, Math.min(step, gameData.value.moves.length));
  drawBoard();
}

function gotoStart(): void {
  gotoStep(0);
}

function gotoEnd(): void {
  gotoStep(gameData.value.moves.length);
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
  
  if (timeDiff >= stepInterval) {
    if (currentStep.value < gameData.value.moves.length) {
      nextStep();
      lastPlayTime = now;
    } else {
      isPlaying.value = false;
      return;
    }
  }
  
  animationFrameId = requestAnimationFrame(playAnimation);
}

// 监听步骤变化，重新绘制
watch(currentStep, () => {
  drawBoard();
});

// 监听游戏数据变化，重置并重新绘制
watch(() => gameData.value.moves, () => {
  currentStep.value = 0;
  drawBoard();
}, { deep: true });

// 组件挂载时初始化
onMounted(() => {
  drawBoard();
  
  // 响应式调整画布大小
  const handleResize = () => {
    const container = boardCanvas.value?.parentElement;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const size = Math.min(containerWidth, containerHeight);
      canvasWidth.value = size;
      canvasHeight.value = size;
      drawBoard();
    }
  };
  
  handleResize();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.bot-replay-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
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
  border: 2px solid #8B4513;
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