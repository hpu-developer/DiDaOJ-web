<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCurrentInstance } from "@/util";
import { ShowTextTipsError } from "@/util/tips";
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetBotGame, ParseBotGame } from "@/apis/bot.ts";
import router from "@/router";
import { BotGameView } from "@/types/bot";

// 获取路由和全局属性
const route = useRoute();
const { globalProperties } = useCurrentInstance();
const userStore = useUserStore();

// 响应式数据
const gameKey = ref(route.params.gameKey as string);
const gameLoading = ref(false);
const gameData = ref<BotGameView | null>(null);
const gameDescription = ref("");

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageBotGame);
});

const handleClickEdit = async () => {
  await router.push({
    name: "manage-bot-game",
    params: {
      gameKey: gameKey.value,
    },
  });
};

const handleClickCreateRoom = async () => {
  await router.push({
    name: "bot-replay-create",
    query: {
      gameKey: gameKey.value,
    },
  });
};

// 加载游戏数据
const loadGameData = async () => {
  gameLoading.value = true;

  try {
    // 验证gameId是否存在
    if (!gameKey.value) {
      throw new Error("游戏ID无效");
    }

    // 调用实际的API来获取游戏数据
    const res = await GetBotGame(gameKey.value);

    // 检查API响应
    if (!res) {
      throw new Error("API响应为空");
    }

    if (res.code !== 0) {
      const errorMsg = `加载游戏数据失败，错误码：${res.code}${res.msg ? "，" + res.msg : ""}`;
      ShowTextTipsError(globalProperties, errorMsg);
      return;
    }

    // 处理API返回的数据
    gameData.value = ParseBotGame(res.data);

    gameDescription.value = gameData.value.description;
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "加载游戏数据时发生未知错误";
    ShowTextTipsError(globalProperties, errorText);
  } finally {
    gameLoading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadGameData();
});
</script>

<template>
  <div class="dida-bot-game-container">
    <div class="dida-row">
      <!-- 左侧：游戏描述 -->
      <div class="dida-col-left">
        <div class="dida-game-description-container">
          <h2 class="dida-game-title">{{ gameData?.title }}</h2>
          <div class="md-preview-wrapper">
            <md-preview :model-value="gameDescription" previewTheme="cyanosis" />
          </div>
        </div>
      </div>

      <!-- 右侧：信息和操作 -->
      <div class="dida-col-right">
        <!-- 问题基础信息 -->
        <t-descriptions layout="vertical" :bordered="true">
          <t-descriptions-item label="游戏名">{{ gameData?.title }}</t-descriptions-item>
          <t-descriptions-item label="最大玩家数">{{ gameData?.playerMax }}</t-descriptions-item>
          <t-descriptions-item label="作者">{{ gameData?.inserterNickname }}</t-descriptions-item>
          <t-descriptions-item label="创建时间">{{ gameData?.insertTime }}</t-descriptions-item>
          <t-descriptions-item label="更新时间">{{ gameData?.modifyTime }}</t-descriptions-item>
        </t-descriptions>

        <div class="dida-operation-container">
          <t-space>
            <t-button @click="handleClickCreateRoom">创建对局</t-button>
          </t-space>
        </div>
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
  margin: 0 0 16px 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.dida-game-description-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.md-preview-wrapper {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
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
