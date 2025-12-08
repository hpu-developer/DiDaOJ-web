<template>
  <div class="bot-replay-container">
    <t-loading :loading="isLoading">
      <!-- 加载失败面板 -->
      <div v-if="loadError" class="load-error-container">
        <div class="load-error-panel">
          <div class="error-icon">❌</div>
          <h2>加载失败</h2>
          <p>无法获取游戏回放数据，请稍后重试。</p>
          <button @click="fetchData" class="retry-btn">重新加载</button>
        </div>
      </div>

      <!-- 游戏内容 -->
      <div v-else>
        <!-- 五子棋游戏 -->
        <Gomoku v-if="gameKey && gameKey.toLowerCase() === 'gomoku'" v-model:gameData="gameData" />

        <!-- 无效游戏提示 -->
        <div v-else class="game-not-found">
          <div class="error-icon">❌</div>
          <h2>游戏未找到</h2>
          <p>无效的游戏类型或游戏不存在。</p>
        </div>
      </div>
    </t-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, getCurrentInstance } from "vue";
import { useRoute } from "vue-router";
import { GetBotReplay, GetBotReplayParam, IsBotStatusRunning, BotStatus } from "@/apis/bot";
import { ShowErrorTips } from "@/util/tips";
import Gomoku from "./game/Gomoku.vue";

// 定义通用的游戏数据接口（具体游戏会有自己的实现）
interface GameData {
  id: string;
  [key: string]: any; // 允许任意属性，具体游戏会定义自己的结构
}

interface BotReplayResponse {
  code: number;
  data?: {
    info: string;
    param: string;
    status: BotStatus;
  };
}

const route = useRoute();
const gameKey = ref("");
const replayId = ref(-1);

// 加载状态
const isLoading = ref(true);
const loadError = ref(false);
const instance = getCurrentInstance();
const botStatus = ref<BotStatus>(BotStatus.BotStatusUnknown);
let refreshTimer: number | null = null;

// 初始化空的游戏数据，具体游戏组件会提供默认值
const gameData = ref<GameData>({
  id: "",
});

// 获取游戏数据
async function fetchData() {
  isLoading.value = true;
  loadError.value = false;

  try {
    const response = await GetBotReplay(gameKey.value, replayId.value);

    if (response.code !== 0) {
      // 显示错误提示
      if (instance) {
        ShowErrorTips(instance.appContext.config.globalProperties, response.code);
      }
      loadError.value = true;
      return;
    }

    if (response.data) {
      const { info, param, status } = response.data;
      botStatus.value = status;

      // 解析游戏特定数据
      const paramData = JSON.parse(param);
      const infoData = JSON.parse(info);

      // 将原始数据传递给游戏组件，让游戏组件自己处理格式转换
      gameData.value = {
        id: `game-${gameKey.value}-${replayId.value}`,
        paramData,
        infoData,
        botStatus: status,
      };

      // 启动定时刷新（如果游戏仍在运行中）
      startAutoRefresh();
    }
  } catch (error) {
    console.error("获取游戏回放数据失败:", error);
    loadError.value = true;
    if (instance) {
      ShowErrorTips(instance.appContext.config.globalProperties, "获取游戏回放数据失败");
    }
  } finally {
    isLoading.value = false;
  }
}

// 获取最新的游戏参数
async function fetchReplayParam() {
  try {
    const response = await GetBotReplayParam(gameKey.value, replayId.value);

    if (response.code === 0 && response.data) {
      const { param, status } = response.data;
      botStatus.value = status;

      // 更新游戏数据，让游戏组件自己处理格式转换
      gameData.value = {
        ...gameData.value,
        paramData: JSON.parse(param),
        botStatus: status,
      };

      // 如果游戏已结束，停止自动刷新
      if (!IsBotStatusRunning(status)) {
        stopAutoRefresh();
      }
    }
  } catch (error) {
    console.error("获取游戏参数失败:", error);
  }
}

// 启动自动刷新
function startAutoRefresh() {
  // 停止现有的定时器（如果存在）
  stopAutoRefresh();

  // 检查状态，如果是运行中则启动定时刷新
  if (IsBotStatusRunning(botStatus.value)) {
    refreshTimer = window.setInterval(fetchReplayParam, 1000);
  }
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// 组件挂载时初始化
onMounted(async () => {
  // 从路由参数获取gameKey和replayId
  if (Array.isArray(route.params.gameKey)) {
    gameKey.value = route.params.gameKey[0];
  } else {
    gameKey.value = route.params.gameKey as string;
  }

  if (Array.isArray(route.params.replayId)) {
    replayId.value = Number(route.params.replayId[0]);
  } else {
    replayId.value = Number(route.params.replayId);
  }

  // 获取游戏数据
  await fetchData();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.bot-replay-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* 加载失败样式 */
.load-error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  width: 100%;
}

.load-error-panel {
  text-align: center;
  padding: 40px;
  background-color: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

/* 游戏未找到样式 */
.game-not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  text-align: center;
  padding: 40px;
  background-color: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 40px 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.game-not-found h2,
.load-error-panel h2 {
  margin-bottom: 16px;
  color: #333;
}

.game-not-found p,
.load-error-panel p {
  margin-bottom: 24px;
  color: #666;
  font-size: 16px;
}

.retry-btn {
  padding: 10px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #66b1ff;
}
</style>
