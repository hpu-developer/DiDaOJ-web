<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips } from "@/util/tips";
import { GetBotGameList, ParseBotGame } from "@/apis/bot";
import type { BotGame, BotGameView } from "@/types/bot";
import { handleGotoBotGame } from "@/util/router";

const { globalProperties } = useCurrentInstance();

const dataLoading = ref(true);
const gameList = ref<BotGameView[]>([]);

const handleNavigateToGame = (game: BotGameView) => {
  handleGotoBotGame(game.gameKey);
};

const fetchGameList = async () => {
  dataLoading.value = true;
  try {
    const response = await GetBotGameList();
    if (response.code !== 0) {
      ShowErrorTips(globalProperties, response.code);
      return;
    }

    const botGames: BotGame[] = response.data;
    gameList.value = botGames.map(ParseBotGame);

  } catch (err) {
    console.error("获取游戏列表失败:", err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
    // 出错时使用默认数据
    gameList.value = [];
  } finally {
    dataLoading.value = false;
    // 在获取列表后手动添加"敬请期待"项（非服务器返回）
    gameList.value.push({
      id: -1,
      gameKey: "",
      title: "敬请期待",
      introduction: "更多精彩游戏即将上线，敬请期待！",
    });
  }
};

onMounted(() => {
  fetchGameList();
});
</script>

<template>
  <t-row>
    <t-col :span="9">
      <t-card style="margin: 10px">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>游戏列表</span>
          </div>
        </template>

        <div v-if="dataLoading" class="loading-container">
          <t-skeleton :rows="3" animated />
        </div>

        <div v-else class="game-list">
          <div v-for="(game, index) in gameList" :key="game.id" class="game-item">
            <t-card :hoverable="index !== gameList.length - 1">
              <div class="game-content">
                <div class="game-info">
                  <h3 class="game-title">{{ game.title }}</h3>
                  <p class="game-introduction">{{ game.introduction }}</p>
                </div>
                <div v-if="index !== gameList.length - 1" class="game-action">
                  <t-button theme="primary" @click="handleNavigateToGame(game)"> 开始游戏 </t-button>
                </div>
              </div>
            </t-card>
          </div>
        </div>
      </t-card>
    </t-col>
  </t-row>
</template>

<style scoped>
.game-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}

.game-item {
  transition: transform 0.2s ease;
}

.game-item:hover {
  transform: translateY(-5px);
}

.game-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.game-info {
  flex: 1;
}

.game-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.game-introduction {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.loading-container {
  padding: 20px;
}
</style>
