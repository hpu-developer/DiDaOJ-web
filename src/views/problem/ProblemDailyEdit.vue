<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import Vditor from "vditor";
import { GetProblemDailyEdit, GetProblemDailyImageToken, ParseProblemDaily, PostProblemDailyCreate, PostProblemDailyEdit } from "@/apis/problem.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { uploadR2Image } from "@/util/md-editor-v3.ts";
import type { ProblemDailyView } from "@/types/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let watchHandle = null as WatchStopHandle | null;

const dailyId = ref("");
const problemLoading = ref(false);
let solutionEditor = null as Vditor | null;
let codeEditor = null as Vditor | null;
const isEditing = ref(false);

const problemDailyData = ref<ProblemDailyView | null>(null);

const dailyEditForm = ref({
  date: "",
  problemId: "",
});

const handleClickView = () => {
  router.push({
    name: "problem-daily-detail",
    params: {
      dailyId: dailyId.value,
    },
  });
};

const handleClickCreate = async () => {
  if (!solutionEditor || !codeEditor) {
    return;
  }

  isEditing.value = true;

  try {
    const createDailyId = dailyEditForm.value.date;
    const res = await PostProblemDailyCreate(createDailyId, dailyEditForm.value.problemId, solutionEditor.getValue(), codeEditor.getValue());

    isEditing.value = true;

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
    isEditing.value = false;
  }
};

const handleClickSave = async () => {
  if (!solutionEditor || !codeEditor) {
    return;
  }

  isEditing.value = true;

  try {
    const res = await PostProblemDailyEdit(dailyId.value, dailyEditForm.value.problemId, solutionEditor.getValue(), codeEditor.getValue());
    isEditing.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (problemDailyData.value) {
      if (res.data.update_time != undefined) {
        problemDailyData.value.updateTime = new Date(res.data.update_time).toLocaleString();
      }
      if (res.data.updater_nickname != undefined) {
        problemDailyData.value.updaterNickname = res.data.updater_nickname;
      }
    }
    if (res.data.solution != undefined) {
      solutionEditor?.setValue(res.data.solution);
    }
    if (res.data.code != undefined) {
      codeEditor?.setValue(res.data.code);
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isEditing.value = false;
  }
};

const loadSolutionEditor = (description: string) => {
  const editOptions = {
    after: () => {
      solutionEditor?.setValue(description);
      problemLoading.value = false;
    },
    upload: {
      accept: "image/*,.mp3, .wav, .rar",
      async handler(files: File[]) {
        return uploadR2Image(solutionEditor as Vditor, files, globalProperties, () => {
          return GetProblemDailyImageToken(dailyId.value);
        });
      },
    },
    preview: {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    },
  } as IOptions;
  solutionEditor = new Vditor("problemEditDiv", editOptions);
};

const loadCodeEditor = (description: string) => {
  const codeEditOptions = {
    after: () => {
      codeEditor?.setValue(description);
      problemLoading.value = false;
    },
    upload: {
      accept: "image/*,.mp3, .wav, .rar",
      async handler(files: File[]) {
        return uploadR2Image(solutionEditor as Vditor, files, globalProperties, () => {
          return GetProblemDailyImageToken(dailyId.value);
        });
      },
    },
    preview: {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    },
  } as IOptions;
  codeEditor = new Vditor("codeEditDiv", codeEditOptions);
};

const loadProblemDaily = async () => {
  const res = await GetProblemDailyEdit(dailyId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("problem get failed", res.code);
    await router.push({ name: "problem" });
    return;
  }

  const daily = res.data;

  problemDailyData.value = ParseProblemDaily(daily, {} as any);

  dailyEditForm.value.problemId = daily.problem_id;

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
        problemLoading.value = true;
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
  <t-loading :loading="problemLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-alert theme="info">可以提前配置将来日期的题目，对外仅展示到截止到当天的题目</t-alert>
          <t-card class="sh-form-card">
            <t-form :model="dailyEditForm">
              <t-form-item label="日期">
                <t-date-picker v-model="dailyEditForm.date" :disabled="dailyId && true" />
              </t-form-item>
              <t-form-item label="问题ID">
                <t-input v-model="dailyEditForm.problemId" placeholder="问题标题"></t-input>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="dailyId">
              <t-button @click="handleClickSave" theme="danger" :loading="isEditing">保存</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isEditing">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="dailyId">
            <t-descriptions-item label="创建时间">{{ problemDailyData?.createTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ problemDailyData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ problemDailyData?.creatorNickname }}</t-descriptions-item>
            <t-descriptions-item label="更新用户">{{ problemDailyData?.updaterNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div>
      <p style="margin-left: 20px">题解：</p>
      <div id="problemEditDiv" class="dida-description-editor"></div>
    </div>
    <div>
      <p style="margin-left: 20px">标程：</p>
      <div id="codeEditDiv" class="dida-description-editor"></div>
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
