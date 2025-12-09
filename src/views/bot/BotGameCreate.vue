<script setup lang="tsx">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo } from "@/util/tips";
import { GetBotGameList, GetBotAgentList, PostBotGameCreateMatch, ParseBotGame } from "@/apis/bot";
import type { BotGame, BotGameView } from "@/types/bot";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

// 加载状态
const dataLoading = ref(true);
const gamesLoading = ref(true);
const agentsLoading = ref(true);
const creatingMatch = ref(false);

// 游戏列表和选择
const gameList = ref<BotGameView[]>([]);
const selectedGame = ref<string | null>(null);

// Agent列表和选择
const agentList = ref<Array<{ id: number; name: string; description: string }>>([]);
const selectedAgents = ref<number[]>([]);

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
const playerSlots = computed(() => {
  const slots = [];
  if (gameInfo.value) {
    for (let i = 1; i <= maxPlayers.value; i++) {
      slots.push({
        index: i,
        isRequired: i <= minPlayers.value
      });
    }
  }
  return slots;
});

// 已选择的Agent映射到空格
const agentSlots = ref<(number | null)[]>([]);

// 当选择游戏时，初始化空格列表
watch(selectedGame, () => {
  selectedAgents.value = [];
  agentSlots.value = Array(maxPlayers.value).fill(null);
});

// 对局信息
const matchInfo = ref<string>("");

// 检查是否可以创建对局
const canCreateMatch = computed(() => {
  return selectedGame.value && 
         selectedAgents.value.length >= minPlayers.value && 
         selectedAgents.value.length <= maxPlayers.value;
});

// 加载游戏列表
const fetchGameList = async () => {
  gamesLoading.value = true;
  try {
    const response = await GetBotGameList();
    gameList.value = response.data.map((item: BotGame) => ParseBotGame(item));
    // 默认选择第一个游戏
    if (gameList.value.length > 0) {
      selectedGame.value = gameList.value[0].gameKey;
    }
  } catch (err) {
    console.error('获取游戏列表失败:', err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    gamesLoading.value = false;
    dataLoading.value = agentsLoading.value ? dataLoading.value : false;
  }
};

// 加载Agent列表
const fetchAgentList = async () => {
  agentsLoading.value = true;
  try {
    const response = await GetBotAgentList();
    agentList.value = response.data;
  } catch (err) {
    console.error('获取Agent列表失败:', err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    agentsLoading.value = false;
    dataLoading.value = gamesLoading.value ? dataLoading.value : false;
  }
};

// 切换游戏时重置选择的Agent
watch(selectedGame, () => {
  selectedAgents.value = [];
});

// 选择/取消选择Agent
const toggleAgent = (agentId: number) => {
  const index = selectedAgents.value.indexOf(agentId);
  if (index === -1) {
    // 检查是否超过最大人数限制
    if (selectedAgents.value.length < maxPlayers.value) {
      selectedAgents.value.push(agentId);
    } else {
      ShowTextTipsInfo(globalProperties, `该游戏最多只能选择 ${maxPlayers.value} 个Agent参与`);
    }
  } else {
    selectedAgents.value.splice(index, 1);
    // 同时从agentSlots中移除
    const slotIndex = agentSlots.value.indexOf(agentId);
    if (slotIndex !== -1) {
      agentSlots.value[slotIndex] = null;
    }
  }
};

// 将Agent分配到指定空格
const assignAgentToSlot = (agentId: number, slotIndex: number) => {
  // 检查该Agent是否已被分配到其他空格
  const currentSlotIndex = agentSlots.value.indexOf(agentId);
  if (currentSlotIndex !== -1) {
    agentSlots.value[currentSlotIndex] = null;
  }
  
  // 检查该空格是否已有其他Agent
  const currentAgentId = agentSlots.value[slotIndex];
  if (currentAgentId !== null) {
    const agentIndex = selectedAgents.value.indexOf(currentAgentId);
    if (agentIndex !== -1) {
      selectedAgents.value.splice(agentIndex, 1);
    }
  }
  
  // 分配Agent到空格
  agentSlots.value[slotIndex] = agentId;
  
  // 确保Agent在selectedAgents中
  if (!selectedAgents.value.includes(agentId)) {
    selectedAgents.value.push(agentId);
  }
};

// 从空格中移除Agent
const removeAgentFromSlot = (slotIndex: number) => {
  const agentId = agentSlots.value[slotIndex];
  if (agentId !== null) {
    const agentIndex = selectedAgents.value.indexOf(agentId);
    if (agentIndex !== -1) {
      selectedAgents.value.splice(agentIndex, 1);
    }
    agentSlots.value[slotIndex] = null;
  }
};

// 创建对局
const handleCreateMatch = async () => {
  if (!canCreateMatch.value || !selectedGame.value) return;
  
  creatingMatch.value = true;
  try {
    await PostBotGameCreateMatch(selectedGame.value, selectedAgents.value, matchInfo.value);
    ShowTextTipsInfo(globalProperties, '对局创建成功！');
    router.push('/bot/replay/list');
  } catch (err) {
    console.error('创建对局失败:', err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    creatingMatch.value = false;
  }
};

// 初始化数据
onMounted(() => {
  fetchGameList();
  fetchAgentList();
});

// 获取Agent名称
const getAgentName = (agentId: number | null) => {
  if (agentId === null) return '未选择';
  const agent = agentList.value.find(a => a.id === agentId);
  return agent ? agent.name : '未知Agent';
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
        <t-select
          v-model="selectedGame"
          placeholder="请选择游戏"
          :disabled="gamesLoading"
          style="width: 300px;"
        >
          <t-option
            v-for="game in gameList"
            :key="game.gameKey"
            :label="game.title"
            :value="game.gameKey"
          >
            <div>
              <div class="option-title">{{ game.title }}</div>
              <div class="option-description">{{ game.description }}</div>
            </div>
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
          <span>{{ gameInfo.description }}</span>
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
        <h3>玩家空格分配 (最少 {{ minPlayers }} 人，最多 {{ maxPlayers }} 人)</h3>
        <div class="slot-container">
          <div 
            v-for="(slot, index) in playerSlots" 
            :key="slot.index"
            class="player-slot"
            :class="{ 'required': slot.isRequired }"
          >
            <div class="slot-header">
              <span class="slot-index">玩家 {{ slot.index }}</span>
              <t-tag v-if="slot.isRequired" theme="warning" size="small">必填</t-tag>
            </div>
            <div class="slot-content">
              <t-select
                v-model="agentSlots[index]"
                placeholder="选择Agent"
                style="width: 100%;"
                @change="(value) => value && assignAgentToSlot(value, index)"
              >
                <t-option
                  v-for="agent in agentList"
                  :key="agent.id"
                  :label="agent.name"
                  :value="agent.id"
                >
                  <div>
                    <div class="option-title">{{ agent.name }}</div>
                    <div class="option-description">{{ agent.description }}</div>
                  </div>
                </t-option>
              </t-select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Agent选择 -->
      <div class="form-section">
        <h3>可用Agent列表</h3>
        <div class="agent-scroll-container">
          <div class="agent-list">
            <t-card
              v-for="agent in agentList"
              :key="agent.id"
              :hoverable="true"
              :class="{ 'selected': selectedAgents.includes(agent.id) }"
              @click="toggleAgent(agent.id)"
            >
              <div class="agent-content">
                <div class="agent-name">{{ agent.name }}</div>
                <div class="agent-description">{{ agent.description }}</div>
              </div>
              <t-tag
                v-if="selectedAgents.includes(agent.id)"
                theme="success"
                variant="light"
              >
                已选择
              </t-tag>
            </t-card>
          </div>
        </div>
      </div>
      
      <!-- 对局信息 -->
      <div class="form-section">
        <h3>对局信息 (可选)</h3>
        <t-textarea
          v-model="matchInfo"
          placeholder="请输入对局的备注信息"
          :rows="3"
          style="width: 100%;"
        ></t-textarea>
      </div>
      
      <!-- 创建按钮 -->
      <div class="form-section">
        <t-button
          theme="primary"
          @click="handleCreateMatch"
          :disabled="!canCreateMatch"
          :loading="creatingMatch"
        >
          创建对局
        </t-button>
        <t-button
          variant="outline"
          @click="router.go(-1)"
          style="margin-left: 10px;"
        >
          返回
        </t-button>
      </div>
    </div>
  </t-card>
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

.option-title {
  font-weight: bold;
}

.option-description {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>