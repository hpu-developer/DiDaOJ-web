<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCurrentInstance } from "@/util";
import { ShowTextTipsInfo, ShowTextTipsError } from "@/util/tips";
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetBotGame } from "@/apis/bot.ts";
import router from "@/router";

// 获取路由和全局属性
const route = useRoute();
const { globalProperties } = useCurrentInstance();
const userStore = useUserStore();

// 响应式数据
const gameId = ref(route.params.gameKey as string);
const gameLoading = ref(false);
const gameData = ref<any>({
  // 提供默认值以确保模板渲染不会出错
  id: '',
  key: '',
  title: '',
  description: '',
  difficulty: '中等',
  maxPlayers: 2,
  timeLimit: '30秒',
  memoryLimit: '256MB',
  author: '系统管理员',
  createTime: '-',
  updateTime: '-'
});
const gameDescription = ref("");
const errorMessage = ref(""); // 用于显示具体错误信息

// 对局相关数据
const matchLoading = ref(false);
const currentMatch = ref<any>(null);
const isCreatingMatch = ref(false);
const hasJoined = ref(false); // 当前用户是否已加入对局
const isJoining = ref(false); // 是否正在加入对局
const isCreator = ref(false); // 当前用户是否是对局创建者

// 计算属性
const isLogin = computed(() => {
  return userStore.isLogin();
});

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageBotGame);
});

const handleClickEdit = async () => {
  await router.push({
    name: "manage-bot-game",
    params: {
      gameKey: gameId.value,
    },
  });
};

// 加载游戏数据
const loadGameData = async () => {
  gameLoading.value = true;
  errorMessage.value = '';

  try {
    // 验证gameId是否存在
    if (!gameId.value) {
      throw new Error('游戏ID无效');
    }

    // 调用实际的API来获取游戏数据
    const res = await GetBotGame(gameId.value);

    // 检查API响应
    if (!res) {
      throw new Error('API响应为空');
    }

    if (res.code !== 0) {
      const errorMsg = `加载游戏数据失败，错误码：${res.code}${res.msg ? '，' + res.msg : ''}`;
      errorMessage.value = errorMsg;
      ShowTextTipsError(globalProperties, errorMsg);
      return;
    }

    // 处理API返回的数据
    const gameInfo = res.data;

    if (!gameInfo) {
      throw new Error('游戏数据为空');
    }

    // 更新游戏数据，保留原有默认值
    gameData.value = {
      ...gameData.value, // 保留默认值
      id: gameInfo.id || gameData.value.id,
      key: gameInfo.key || gameData.value.key,
      title: gameInfo.title || gameData.value.title,
      description: gameInfo.description || gameData.value.description,
      createTime: gameInfo.insert_time || gameInfo.createTime || gameData.value.createTime,
      updateTime: gameInfo.modify_time || gameInfo.updateTime || gameData.value.updateTime
    };

    gameDescription.value = gameData.value.description;
  } catch (error) {
    const errorText = error instanceof Error ? error.message : '加载游戏数据时发生未知错误';
    errorMessage.value = errorText;
    ShowTextTipsError(globalProperties, errorText);
  } finally {
    gameLoading.value = false;
  }
};

// 加载当前对局信息
const loadCurrentMatch = async () => {
  matchLoading.value = true;
  try {
    // 这里应该调用实际的API来获取对局数据
    // 暂时使用模拟数据
    await new Promise((resolve) => setTimeout(resolve, 500));
    // 添加模拟数据
    currentMatch.value = {
      id: "match-123",
      status: "waiting",
      createTime: new Date().toISOString(),
      creator: userStore.getUserId || "user-1", // 添加创建者信息
      players: [
        { id: "user-1", name: "玩家1", score: 0 },
        { id: "user-2", name: "玩家2", score: 0 },
      ],
    };

    // 检查当前用户是否已加入对局和是否是创建者
    checkUserStatus();
  } catch (error) {
    ShowTextTipsError(globalProperties, "加载对局信息失败");
    currentMatch.value = null;
    hasJoined.value = false;
    isCreator.value = false;
  } finally {
    matchLoading.value = false;
  }
};

// 检查用户在对局中的状态
const checkUserStatus = () => {
  const currentUserId = userStore.getUserId;

  if (currentUserId && currentMatch.value) {
    // 检查是否已加入
    hasJoined.value = currentMatch.value.players?.some((player: any) => player.id === currentUserId) || false;

    // 检查是否是创建者
    isCreator.value = currentMatch.value.creator === currentUserId;
  } else {
    hasJoined.value = false;
    isCreator.value = false;
  }
};

// 创建新对局
const createNewMatch = async () => {
  if (!isLogin.value) {
    ShowTextTipsInfo(globalProperties, "请先登录");
    return;
  }

  isCreatingMatch.value = true;
  try {
    // 这里应该调用实际的API来创建对局
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ShowTextTipsInfo(globalProperties, "创建对局成功");
    // 重新加载对局信息
    await loadCurrentMatch();
  } catch (error) {
    ShowTextTipsError(globalProperties, "创建对局失败");
  } finally {
    isCreatingMatch.value = false;
  }
};

// 根据难度返回对应的标签样式
const getDifficultyVariant = (difficulty: string): string => {
  switch (difficulty) {
    case "简单":
      return "success";
    case "中等":
      return "warning";
    case "困难":
      return "danger";
    default:
      return "default";
  }
};

// 格式化时间显示
const formatTime = (timeStr?: string): string => {
  if (!timeStr) return "-";
  try {
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  } catch (e) {
    return timeStr;
  }
};

// 根据对局状态返回对应的标签样式
const getMatchStatusVariant = (status?: string): string => {
  switch (status) {
    case "waiting":
      return "warning";
    case "playing":
      return "success";
    case "completed":
      return "default";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
};

// 获取对局状态的中文文本
const getMatchStatusText = (status?: string): string => {
  switch (status) {
    case "waiting":
      return "等待中";
    case "playing":
      return "进行中";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status || "-";
  }
};

// 计算玩家进度百分比
const getPlayerProgress = (currentPlayers: number, maxPlayers: number): number => {
  if (!maxPlayers) return 0;
  return Math.min(Math.round((currentPlayers / maxPlayers) * 100), 100);
};

// 加入对局
const joinGame = async () => {
  if (!isLogin.value) {
    ShowTextTipsInfo(globalProperties, "请先登录");
    return;
  }

  isJoining.value = true;
  try {
    // 这里应该调用实际的API来加入对局
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ShowTextTipsInfo(globalProperties, "加入对局成功");
    hasJoined.value = true;
    // 重新加载对局信息
    await loadCurrentMatch();
  } catch (error) {
    ShowTextTipsError(globalProperties, "加入对局失败");
  } finally {
    isJoining.value = false;
  }
};

// 进入对局
const enterGame = () => {
  if (!isLogin.value || !hasJoined.value) {
    ShowTextTipsInfo(globalProperties, "请先登录并加入对局");
    return;
  }
  // 这里应该跳转到对局页面或打开对局窗口
  ShowTextTipsInfo(globalProperties, "进入对局");
};

// 取消对局
const cancelGame = async () => {
  if (!currentMatch.value) return;

  try {
    // 这里应该调用实际的API来取消对局
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ShowTextTipsInfo(globalProperties, "取消对局成功");
    // 重新加载对局信息
    await loadCurrentMatch();
  } catch (error) {
    ShowTextTipsError(globalProperties, "取消对局失败");
  }
};

// 编辑游戏
const editGame = () => {
  // 这里应该跳转到编辑页面
  ShowTextTipsInfo(globalProperties, "跳转到编辑页面");
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadGameData();
  await loadCurrentMatch();
});
</script>

<template>
  <div class="dida-bot-game-container">
    <div class="dida-row">
      <!-- 左侧：游戏描述 -->
      <div class="dida-col-left">
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="dida-error-message">
          {{ errorMessage }}
        </div>

        <t-card :loading="gameLoading" style="margin-bottom: 10px">
          <template #header>
            <div class="dida-card-header">
              <h2 class="dida-game-title">{{ gameData.title }}</h2>
            </div>
          </template>
          <div class="dida-game-description">
            <md-preview :model-value="gameDescription" previewTheme="cyanosis" />
          </div>
        </t-card>
      </div>

      <!-- 右侧：信息和操作 -->
      <div class="dida-col-right">
        <!-- 问题基础信息 -->
        <t-descriptions layout="vertical" :bordered="true">
          <t-descriptions-item label="游戏名">{{ gameData?.title }}</t-descriptions-item>
          <t-descriptions-item label="最大玩家数">{{ gameData?.maxPlayers }}</t-descriptions-item>
          <t-descriptions-item label="作者">{{ gameData?.author }}</t-descriptions-item>
          <t-descriptions-item label="创建时间">{{ formatTime(gameData?.createTime) }}</t-descriptions-item>
          <t-descriptions-item label="更新时间">{{ formatTime(gameData?.updateTime) }}</t-descriptions-item>
        </t-descriptions>

        <!-- 操作按钮 -->
        <div class="dida-operation-container">
          <t-space>
            <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
          </t-space>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dida-bot-game-container {
  padding: 10px;
}

.dida-row {
  display: flex;
  gap: 20px;
}

.dida-col-left {
  flex: 3;
}

.dida-col-right {
  flex: 2;
  min-width: 300px;
}

.dida-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dida-game-title {
  margin: 0;
  font-size: 1.5rem;
}

.dida-game-description {
  line-height: 1.6;
  white-space: pre-wrap;
}

.dida-match-info {
  line-height: 1.6;
}

.players-container {
  max-height: 200px;
  overflow-y: auto;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.player-rank {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background-color: #f5f7fa;
  border-radius: 50%;
  font-size: 12px;
  margin-right: 12px;
  font-weight: bold;
}

.player-name {
  flex: 1;
  font-weight: 500;
}

.player-score {
  color: #1890ff;
  font-weight: 500;
}

.no-players {
  text-align: center;
  padding: 20px;
  color: #999;
}

.progress-container {
  display: flex;
  align-items: center;
}

.progress-text {
  margin-left: 10px;
  font-size: 14px;
  color: #666;
}

.dida-no-match {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.dida-operation-container {
  margin: 10px 0 20px;
  text-align: right;
}

.dida-error-message {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #f5222d;
  font-size: 14px;
}
</style>
