<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCurrentInstance } from "@/util";
import { ShowTextTipsInfo, ShowTextTipsError } from "@/util/tips";
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";

// 获取路由和全局属性
const route = useRoute();
const { globalProperties } = useCurrentInstance();
const userStore = useUserStore();

// 响应式数据
const gameId = ref(route.params.id as string);
const gameLoading = ref(false);
const gameData = ref<any>(null);
const gameDescription = ref("");

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

// 加载游戏数据
const loadGameData = async () => {
  gameLoading.value = true;
  try {
    // 这里应该调用实际的API来获取游戏数据
    // 暂时使用模拟数据
    await new Promise((resolve) => setTimeout(resolve, 500));
    gameData.value = {
      id: gameId.value,
      title: "机器人对战游戏示例",
      description:
        "这是一个机器人对战游戏的描述信息。玩家需要编写AI代码控制机器人进行对战。游戏规则：\n\n1. 每个玩家控制一个机器人\n2. 机器人可以移动、攻击和使用技能\n3. 目标是击败对手的机器人\n4. 游戏有时间限制，超时则根据剩余生命值判断胜负\n\n请编写你的AI逻辑来赢得比赛！",
      difficulty: "中等",
      maxPlayers: 2,
      timeLimit: "30秒",
      memoryLimit: "256MB",
      author: "系统管理员",
      createTime: "2023-01-01 10:00:00",
      updateTime: "2023-01-01 10:00:00",
    };
    gameDescription.value = gameData.value.description;
  } catch (error) {
    ShowTextTipsError(globalProperties, "加载游戏数据失败");
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
        <t-card :loading="gameLoading" style="margin-bottom: 10px">
          <template #header>
            <div class="dida-card-header">
              <h2 class="dida-game-title">{{ gameData?.title }}</h2>
            </div>
          </template>
          <div class="dida-game-description">
            <div v-html="gameDescription.replace(/\n/g, '<br>')"></div>
          </div>
        </t-card>
      </div>

      <!-- 右侧：信息和操作 -->
      <div class="dida-col-right">
        <!-- 问题基础信息 -->
        <t-card style="margin-bottom: 10px" title="游戏信息">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="游戏名">{{ gameData?.title }}</t-descriptions-item>
            <t-descriptions-item label="最大玩家数">{{ gameData?.maxPlayers }}</t-descriptions-item>
            <t-descriptions-item label="时间限制">{{ gameData?.timeLimit }}</t-descriptions-item>
            <t-descriptions-item label="内存限制">{{ gameData?.memoryLimit }}</t-descriptions-item>
            <t-descriptions-item label="分类">{{ gameData?.category || "-" }}</t-descriptions-item>
            <t-descriptions-item label="来源">{{ gameData?.source || "-" }}</t-descriptions-item>
            <t-descriptions-item label="提交数">{{ gameData?.submitCount || 0 }}</t-descriptions-item>
            <t-descriptions-item label="通过数">{{ gameData?.acceptCount || 0 }}</t-descriptions-item>
            <t-descriptions-item label="通过率">{{ gameData?.passRate || "0%" }}</t-descriptions-item>
            <t-descriptions-item label="作者">{{ gameData?.author }}</t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ formatTime(gameData?.createTime) }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ formatTime(gameData?.updateTime) }}</t-descriptions-item>
          </t-descriptions>
        </t-card>

        <!-- 操作按钮 -->
        <div class="dida-operation-container">
          <t-space>
            <t-button
              v-if="!currentMatch || currentMatch.status === 'completed' || currentMatch.status === 'cancelled'"
              type="primary"
              :loading="isCreatingMatch"
              @click="createNewMatch"
              :disabled="!isLogin"
              size="large"
            >
              创建对局
            </t-button>
            <t-button
              v-else-if="currentMatch.status === 'waiting'"
              type="success"
              @click="joinGame"
              size="large"
              :disabled="!isLogin || hasJoined || isJoining"
              :loading="isJoining"
            >
              {{ hasJoined ? "已加入" : "加入对局" }}
            </t-button>
            <t-button v-else-if="currentMatch.status === 'playing'" type="info" @click="enterGame" size="large" :disabled="!isLogin || !hasJoined">
              进入对局
            </t-button>
            <t-button
              v-if="currentMatch && isCreator"
              type="danger"
              @click="cancelGame"
              size="large"
              :disabled="currentMatch.status === 'playing' || currentMatch.status === 'completed'"
            >
              取消对局
            </t-button>
            <t-button v-if="hasEditAuth" @click="editGame" type="default"> 编辑游戏 </t-button>
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
  flex: 1;
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
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .dida-row {
    flex-direction: column;
  }

  .dida-col-right {
    min-width: auto;
  }
}
</style>
