<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { HandleR2ImageUpload } from "@/util/md-editor-v3.ts";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, ShowTextTipsSuccess } from "@/util/tips";
import { GetBotGame, GetBotGameImageToken, ParseBotGame, PostBotGameCreate, PostBotGameEdit } from "@/apis/bot.ts";

// Monaco Editor imports
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

let gameId = 0;
const gameKey = ref("");
const gameLoading = ref(false);
const isSaving = ref(false);
const disabledEdit = ref(false);

const gameData = ref<any>(null);

const gameEditForm = ref({
  title: "",
  description: "",
  judgeCode: "",
});

// Code editor related
const judgeCodeEditRef = ref<HTMLElement | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;

const handleClickView = () => {
  router.push({
    name: "bot-game",
    params: {
      gameKey: gameKey.value,
    },
  });
};

const onUploadImg = async (files: File[], callback: (urls: { url: string; alt: string; title: string }[]) => void) => {
  disabledEdit.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, () => {
    return GetBotGameImageToken(gameId);
  });
  disabledEdit.value = false;
};

const handleClickCreate = async () => {
  isSaving.value = true;

  try {
    const res = await PostBotGameCreate(
      gameEditForm.value.title,
      gameEditForm.value.description,
      gameEditForm.value.judgeCode,
    );

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      await router.push({
        name: "bot-game",
        params: { gameKey: res.data.game_key },
      });
    }

    ShowTextTipsSuccess(globalProperties, "创建成功");
  } finally {
    isSaving.value = false;
  }
};

const handleClickSave = async () => {
  isSaving.value = true;

  try {
    const res = await PostBotGameEdit(
      gameId,
      gameEditForm.value.title,
      gameEditForm.value.description,
      gameEditForm.value.judgeCode
    );

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (gameData.value) {
      if (res.data.modify_time != undefined) {
        gameData.value.modifyTime = new Date(res.data.modify_time).toLocaleString();
      }
    }
    if (res.data.description != undefined) {
      gameEditForm.value.description = res.data.description;
    }
    if (res.data.judge_code != undefined) {
      gameEditForm.value.judgeCode = res.data.judge_code;
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const onEditSave = async () => {
  if (gameId){
    await handleClickSave();
  } else {
    await handleClickCreate();
  }
}

const loadDescriptionEditor = (description: string) => {
  gameEditForm.value.description = description;
  gameLoading.value = false;
};

// 初始化代码编辑器
const initCodeEditor = () => {
  if (judgeCodeEditRef.value) {
    // 清空现有内容
    judgeCodeEditRef.value.innerHTML = "";

    // 创建编辑器容器
    const editorContainer = document.createElement("div");
    editorContainer.style.width = "100%";
    editorContainer.style.height = "400px";

    codeEditor = monaco.editor.create(editorContainer, {
      value: gameEditForm.value.judgeCode,
      language: "go",
      minimap: { enabled: true },
      colorDecorators: true,
      readOnly: disabledEdit.value || isSaving.value,
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      tabSize: 2,
      scrollBeyondLastLine: false,
    });

    judgeCodeEditRef.value.appendChild(editorContainer);

    // 监听编辑器内容变化
    codeEditor.onDidChangeModelContent(() => {
      if (codeEditor) {
        gameEditForm.value.judgeCode = codeEditor.getValue();
      }
    });

    // 确保编辑器正确布局
    nextTick(() => {
      if (codeEditor) {
        codeEditor.layout();
      }
    });
  }
};

// 更新编辑器内容
const updateCodeEditorContent = () => {
  if (codeEditor) {
    codeEditor.setValue(gameEditForm.value.judgeCode);
    codeEditor.updateOptions({
      readOnly: disabledEdit.value || isSaving.value
    });
  }
};

// 销毁编辑器
const disposeCodeEditor = () => {
  if (codeEditor) {
    codeEditor.dispose();
    codeEditor = null;
  }
};

const loadGame = async () => {
  const res = await GetBotGame(gameKey.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("game get failed", res.code);
    await router.push({ name: "bot-game" });
    return;
  }

  const gameInfo = ParseBotGame(res.data);

  if (!gameInfo) {
    ShowErrorTips(globalProperties, "获取游戏数据失败");
    await router.push({ name: "bot-game" });
    return;
  }

  gameId = gameInfo.id;
  gameData.value = gameInfo;

  gameEditForm.value.title = gameInfo.title;
  gameEditForm.value.description = gameInfo.description || "";
  gameEditForm.value.judgeCode = gameInfo.judgeCode || "";

  webStyleStore.setTitle(gameInfo.title + " - " + webStyleStore.getTitle);

  loadDescriptionEditor(gameInfo.description || "");
  
  // 等待DOM更新后初始化代码编辑器
  nextTick(() => {
    initCodeEditor();
  });
};

onMounted(async () => {
  if (Array.isArray(route.params.gameKey)) {
    gameKey.value = route.params.gameKey[0];
  } else {
    gameKey.value = route.params.gameKey;
  }

  if (gameKey.value) {
    gameLoading.value = true;
    try {
      await loadGame();
    } catch (err) {
      console.error(err);
      ShowErrorTips(globalProperties, "获取数据异常");
      await router.push({ name: "bot-game" });
    }
  } else {
    loadDescriptionEditor("");
    // 初始化空的代码编辑器
    nextTick(() => {
      initCodeEditor();
    });
  }
});

// 在组件卸载前销毁编辑器
onBeforeUnmount(() => {
  disposeCodeEditor();
});
</script>

<template>
  <t-loading :loading="gameLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px;margin-top: 50px;">
          <t-card class="sh-card" :bordered="false">
            <t-form :model="gameEditForm">
              <t-form-item label="标题">
                <t-input v-model="gameEditForm.title" placeholder="游戏标题"></t-input>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="gameId">
              <t-button @click="handleClickSave" theme="danger" :loading="isSaving">保存</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isSaving">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="gameId">
            <t-descriptions-item label="创建时间">{{ gameData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ gameData?.modifyTime }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div class="dida-description-editor">
      <p>游戏描述</p>
      <t-loading :loading="disabledEdit || isSaving">
        <md-editor-v3 v-model="gameEditForm.description" @save="onEditSave" @onUploadImg="onUploadImg" previewTheme="cyanosis"></md-editor-v3>
      </t-loading>
    </div>
    
    <div class="dida-code-editor-container">
      <p>Judge Code</p>
      <t-loading :loading="disabledEdit || isSaving">
        <div class="dida-code-editor-div" ref="judgeCodeEditRef"></div>
      </t-loading>
    </div>
  </t-loading>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-description-editor {
  margin: 20px;
}

.dida-code-editor-container {
  margin: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.dida-code-editor-container p {
  margin: 0;
  padding: 10px 20px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
}

.dida-code-editor-div {
  width: 100%;
  height: 400px;
}
</style>
