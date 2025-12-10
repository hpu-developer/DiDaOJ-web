<script setup lang="tsx">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips } from "@/util/tips";
import { GetBotGameList, GetBotAgentList, ParseBotGame, ParseBotAgent } from "@/apis/bot";
import { GetAvatarUrl } from "@/util/avatar";
import { handleOpenUsername } from "@/util/router";
import type { BotAgent, BotAgentView, BotGame, BotGameView } from "@/types/bot";

const router = useRouter();
const { globalProperties } = useCurrentInstance();

// 游戏列表和选择
const gameList = ref<BotGameView[]>([]);
const selectedGame = ref<string | null>(null);

// 加载状态
const dataLoading = ref(true);
const gamesLoading = ref(true);
const creatingMatch = ref(false);

const showAgentDialog = ref(false);
let currentSelectAgentIndex = -1;
const agentLoading = ref(true);
const agentList = ref<BotAgentView[]>([]);

// 游戏信息
const gameInfo = computed(() => {
  return gameList.value.find(game => game.gameKey === selectedGame.value) || null;
});

// 游戏最小人数
const minPlayers = computed(() => {
  return gameInfo.value?.playerMin || 2;
});

// 游戏最大人数
const maxPlayers = computed(() => {
  return gameInfo.value?.playerMax || 2;
});

// 空格列表
const playerSlots = ref([] as { index: number; isRequired: boolean; isLoading: boolean, agent: BotAgentView | null }[])

const handleSelectAgent = (agentId: number) => {
  playerSlots.value[currentSelectAgentIndex].agent = agentList.value.find(agent => agent.id === agentId) || null;
  showAgentDialog.value = false;
}

const agentColumns = [
  {
    title: "ID",
    colKey: "id",
  },
  {
    title: "名称",
    colKey: "name",
  },
  {
    title: "版本",
    colKey: "version",
  },
  {
    title: "作者",
    colKey: "inserter",
    cell: (_: any, data: any) => {
      const avatarUrl = GetAvatarUrl(data.row.inserterUsername, data.row.inserterEmail);
      return (
        <t-space>
          <t-avatar shape="round" size="32px" image={avatarUrl} hide-on-load-failed={false} />
          <t-button variant="text" onClick={() => handleOpenUsername(router, data.row.inserterUsername)}>
            {data.row.inserterNickname}
          </t-button>
        </t-space>
      );
    },
  },
  {
    title: "操作",
    colKey: "action",
    cell: (_: any, data: any) => {
      return (
        <t-space>
          <t-button theme="default" onClick={() => handleSelectAgent(data.row.id)}>
            选择
          </t-button>
        </t-space>
      );
    }
  }
];

// 检查是否可以创建对局
const canCreateMatch = computed(() => {
  return selectedGame.value;
});

const onGameChange = () => {
  playerSlots.value = []
  if (gameInfo.value) {
    for (let i = 1; i <= maxPlayers.value; i++) {
      playerSlots.value.push({
        index: i,
        isRequired: i <= minPlayers.value,
        isLoading: false,
        agent: null
      });
    }
  }
}

// 加载游戏列表
const fetchGameList = async () => {
  dataLoading.value = true;
  try {
    const response = await GetBotGameList();
    gameList.value = response.data.map((item: BotGame) => ParseBotGame(item));
    // 默认选择第一个游戏
    if (gameList.value.length > 0) {
      selectedGame.value = gameList.value[0].gameKey;
      onGameChange();
    }
  } catch (err) {
    console.error('获取游戏列表失败:', err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    gamesLoading.value = false;
    dataLoading.value = false;
  }
};

const fetchAgentList = async () => {
  agentLoading.value = true;

  try {
    const response = await GetBotAgentList(Number(searchForm.value.Id), searchForm.value.username, searchForm.value.name);
    if (response.code !== 0) {
      ShowErrorTips(globalProperties, response.code);
      return;
    }

    agentList.value = []

    if (response.data) {
      agentList.value = response.data.map((item: BotAgent) => ParseBotAgent(item));
    }
  } finally {
    agentLoading.value = false;
  }

}

const openAgentDialog = async (slotIndex: number) => {
  currentSelectAgentIndex = slotIndex;
  playerSlots.value[currentSelectAgentIndex].isLoading = true;
  await fetchAgentList()
  playerSlots.value[currentSelectAgentIndex].isLoading = false;
  showAgentDialog.value = true;
};

const searchForm = ref({
  Id: "",
  username: "",
  name: "",
});

const handleSearchFormSubmit = async (form: any) => {
  await fetchAgentList();
};

const handleSearchFormReset = async () => {
  searchForm.value.Id = "";
  searchForm.value.username = "";
  searchForm.value.name = "";
  await fetchAgentList();
};

// 清除选择的 Agent
const clearSelectedAgent = () => {
  playerSlots.value[currentSelectAgentIndex].agent = null;
  showAgentDialog.value = false;
}

// 创建对局
const handleCreateMatch = async () => {

};

// 初始化数据
onMounted(() => {
  fetchGameList();
});

</script>

<template>
  <t-card style="margin: 10px;">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>创建对局</span>
      </div>
    </template>

    <div v-if="dataLoading" class="loading-container">
      <t-skeleton :rows="8" animated />
    </div>

    <div v-else class="create-match-container">
      <!-- 游戏选择 -->
      <div class="form-section">
        <h3>选择游戏</h3>
        <t-select v-model="selectedGame" placeholder="请选择游戏" :disabled="gamesLoading" style="width: 300px;"
          @change="onGameChange">
          <t-option v-for="game in gameList" :key="game.gameKey" :label="game.title" :value="game.gameKey">
            {{ game.title }}
          </t-option>
        </t-select>
      </div>

      <!-- 游戏信息展示 -->
      <div v-if="gameInfo" class="form-section game-info">
        <h3>游戏信息</h3>
        <div class="info-item">
          <span class="label">游戏名称：</span>
          <span>{{ gameInfo.title }}</span>
        </div>
        <div class="info-item">
          <span class="label">游戏描述：</span>
          <span>{{ gameInfo.introduction }}</span>
        </div>
        <div class="info-item">
          <span class="label">最小人数：</span>
          <span>{{ minPlayers }}</span>
        </div>
        <div class="info-item">
          <span class="label">最大人数：</span>
          <span>{{ maxPlayers }}</span>
        </div>
      </div>

      <!-- 空格选择 -->
      <div class="form-section">
        <h3>玩家分配 (最少 {{ minPlayers }} 人，最多 {{ maxPlayers }} 人)</h3>
        <div class="slot-container">
          <div v-for="(slot, index) in playerSlots" :key="slot.index" class="player-slot"
            :class="{ 'required': slot.isRequired }">
            <div class="slot-header">
              <span class="slot-index">玩家 {{ slot.index }}</span>
              <t-tag v-if="slot.isRequired" theme="warning" size="small">必填</t-tag>
            </div>
            <div class="slot-content">
              <t-button block variant="dashed" @click="openAgentDialog(index)" :loading="slot.isLoading">
                <template v-if="slot.agent">
                  {{ slot.agent.name }}
                </template>
                <template v-else>
                  选择 Agent
                </template>
              </t-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建按钮 -->
      <div class="form-section">
        <t-button theme="primary" @click="handleCreateMatch" :disabled="!canCreateMatch" :loading="creatingMatch">
          创建对局
        </t-button>
        <t-button variant="outline" @click="router.go(-1)" style="margin-left: 10px;">
          返回
        </t-button>
      </div>
    </div>
  </t-card>

  <t-dialog v-model:visible="showAgentDialog" :footer="false" :width="1300" :header="gameInfo?.title">
    <t-form layout="inline" @submit="handleSearchFormSubmit" @reset="handleSearchFormReset">
      <t-form-item label="ID">
        <t-input v-model="searchForm.Id" placeholder="请输入Agent ID" />
      </t-form-item>
      <t-form-item label="名称">
        <t-input v-model="searchForm.name" placeholder="请输入Agent名称" />
      </t-form-item>
      <t-form-item label="作者">
        <t-input v-model="searchForm.username" placeholder="仅支持输入完整用户名" />
      </t-form-item>
      <t-form-item>
        <t-space>
          <t-button theme="primary" type="submit">搜索</t-button>
          <t-button theme="default" variant="base" type="reset">重置</t-button>
          <t-button theme="danger" @click="clearSelectedAgent">清除</t-button>
        </t-space>
      </t-form-item>
    </t-form>
    <t-table :columns="agentColumns" :data="agentList" row-key="id" :loading="agentLoading"></t-table>
  </t-dialog>
</template>

<style scoped>
.create-match-container {
  padding: 10px 0;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  margin-bottom: 12px;
  color: #1890ff;
  font-size: 16px;
}

.loading-container {
  padding: 20px 0;
}

.game-info .info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.game-info .label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 80px;
}

.agent-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
}

.agent-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.agent-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-name {
  font-weight: bold;
  font-size: 16px;
}

.agent-description {
  color: #666;
  font-size: 14px;
}

.agent-list .t-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.slot-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.player-slot {
  width: 250px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.player-slot.required {
  border-color: #faad14;
  background-color: #fffbe6;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slot-index {
  font-weight: bold;
  font-size: 14px;
}
</style>