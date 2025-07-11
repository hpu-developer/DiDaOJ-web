<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetProblemDailyEdit, GetProblemDailyImageToken, ParseProblemDaily, PostProblemDailyCreate, PostProblemDailyEdit } from "@/apis/problem.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import type { WatchStopHandle } from "vue";
import type { ProblemDailyView } from "@/types/problem.ts";
import { HandleR2ImageUpload, UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let watchHandle = null as WatchStopHandle | null;

const dailyId = ref("");
const problemDailyLoading = ref(false);
const isSaving = ref(false);

const problemDailyData = ref<ProblemDailyView | null>(null);

const dailyEditForm = ref({
  date: "",
  problemKey: "",
  solution: "",
  code: "",
});

const handleClickView = () => {
  router.push({
    name: "problem-daily-detail",
    params: {
      dailyId: dailyId.value,
    },
  });
};

async function handleUploadImg(files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) {
  isSaving.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, () => {
    return GetProblemDailyImageToken(dailyId.value);
  });
  isSaving.value = false;
}

const handleClickCreate = async () => {
  isSaving.value = true;

  try {
    const createDailyId = dailyEditForm.value.date;
    const res = await PostProblemDailyCreate(createDailyId, dailyEditForm.value.problemKey, dailyEditForm.value.solution, dailyEditForm.value.code);

    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    await router.push({
      name: "manage-problem-daily",
      params: { dailyId: createDailyId },
    });

    ShowTextTipsSuccess(globalProperties, "创建成功");
  } finally {
    isSaving.value = false;
  }
};

const handleClickSave = async () => {
  isSaving.value = true;

  try {
    const res = await PostProblemDailyEdit(dailyId.value, dailyEditForm.value.problemKey, dailyEditForm.value.solution, dailyEditForm.value.code);
    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (problemDailyData.value) {
      if (res.data.update_time != undefined) {
        problemDailyData.value.modifyTime = new Date(res.data.modify_time).toLocaleString();
      }
      if (res.data.updater_nickname != undefined) {
        problemDailyData.value.modifierNickname = res.data.updater_nickname;
      }
    }
    if (res.data.solution != undefined) {
      dailyEditForm.value.solution = res.data.solution;
    }
    if (res.data.code != undefined) {
      dailyEditForm.value.code = res.data.code;
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const loadSolutionEditor = (description: string) => {
  dailyEditForm.value.solution = description;
  problemDailyLoading.value = false;
};

const loadCodeEditor = (description: string) => {
  dailyEditForm.value.code = description;
  problemDailyLoading.value = false;
};

const loadProblemDaily = async () => {
  const res = await GetProblemDailyEdit(dailyId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("problem get failed", res.code);
    await router.push({ name: "problem-daily-list" });
    return;
  }

  const daily = res.data;

  problemDailyData.value = ParseProblemDaily(daily, {} as any);

  dailyEditForm.value.problemKey = daily.problem_key;

  loadSolutionEditor(daily.solution);
  loadCodeEditor(daily.code);
};

onMounted(async () => {
  watchHandle = watch(
    () => route.params,
    async () => {
      if (Array.isArray(route.params.dailyId)) {
        dailyId.value = route.params.dailyId[0];
      } else {
        dailyId.value = route.params.dailyId;
      }

      if (dailyId.value) {
        problemDailyLoading.value = true;
        dailyEditForm.value.date = dailyId.value;
        await loadProblemDaily();
      } else {
        loadSolutionEditor("暂无题解");
        loadCodeEditor("暂无标程");
      }
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  if (watchHandle) {
    watchHandle();
    watchHandle = null;
  }
});
</script>

<template>
  <t-loading :loading="problemDailyLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-alert theme="info">可以提前配置将来日期的题目，对外仅展示到截止到当天的题目</t-alert>
          <t-card class="sh-form-card">
            <t-form :model="dailyEditForm">
              <t-form-item label="日期">
                <t-date-picker v-model="dailyEditForm.date" :disabled="dailyId && true" />
              </t-form-item>
              <t-form-item label="问题标识">
                <t-input v-model="dailyEditForm.problemKey" placeholder="问题标题"></t-input>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="dailyId">
              <t-button @click="handleClickSave" theme="danger" :loading="isSaving">保存</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isSaving">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="dailyId">
            <t-descriptions-item label="创建时间">{{ problemDailyData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ problemDailyData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ problemDailyData?.inserterNickname }}</t-descriptions-item>
            <t-descriptions-item label="更新用户">{{ problemDailyData?.modifierNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div>
      <p style="margin-left: 20px">题解：</p>
      <md-editor-v3
        id="daily-solution-editor"
        v-model="dailyEditForm.solution"
        @save="handleClickSave"
        @onUploadImg="handleUploadImg"
        previewTheme="cyanosis"
      ></md-editor-v3>
      <t-loading :loading="isSaving" attach="#daily-solution-editor" :z-index="100000"></t-loading>
    </div>
    <div>
      <p style="margin-left: 20px">标程：</p>
      <md-editor-v3
        id="daily-code-editor"
        v-model="dailyEditForm.code"
        @save="handleClickSave"
        @onUploadImg="handleUploadImg"
        previewTheme="cyanosis"
      ></md-editor-v3>
      <t-loading :loading="isSaving" attach="#daily-code-editor" :z-index="100000"></t-loading>
    </div>
  </t-loading>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.sh-form-card {
  margin: 10px;
}

.dida-description-editor {
  margin: 20px;
  width: 100%;
  max-width: calc(100vw - 300px);
  min-height: 200px;
  z-index: 9999 !important;
}
</style>
