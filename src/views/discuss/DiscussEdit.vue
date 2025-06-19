<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetDiscuss, GetDiscussImageToken, ParseDiscuss, PostDiscussCreate, PostDiscussEdit } from "@/apis/discuss.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import type { WatchStopHandle } from "vue";
import type { DiscussView } from "@/types/discuss.ts";
import { HandleR2ImageUpload, UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";
import type { ContestEditRequest } from "@/types/contest.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let watchHandle = null as WatchStopHandle | null;

const discussId = ref("");
const discussLoading = ref(false);
const isSaving = ref(false);

const discussData = ref<DiscussView | null>(null);

const discussEditForm = ref({
  title: "",
  content: "",
});

const handleClickView = () => {
  router.push({
    name: "problem-daily-detail",
    params: {
      dailyId: discussId.value,
    },
  });
};

async function handleUploadImg(files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) {
  isSaving.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, () => {
    return GetDiscussImageToken(discussId.value);
  });
  isSaving.value = false;
}

const handleClickCreate = async () => {
  isSaving.value = true;

  try {
    const postData = {
      title: discussEditForm.value.title,
    } as DiscussEditRequest;
    const res = await PostDiscussCreate(postData);

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
    const res = await PostDiscussEdit(discussId.value, discussEditForm.value.problemId, discussEditForm.value.solution, discussEditForm.value.code);
    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (discussData.value) {
      if (res.data.update_time != undefined) {
        discussData.value.updateTime = new Date(res.data.update_time).toLocaleString();
      }
      if (res.data.updater_nickname != undefined) {
        discussData.value.updaterNickname = res.data.updater_nickname;
      }
    }
    if (res.data.solution != undefined) {
      discussEditForm.value.solution = res.data.solution;
    }
    if (res.data.code != undefined) {
      discussEditForm.value.code = res.data.code;
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const loadSolutionEditor = (description: string) => {
  discussEditForm.value.solution = description;
  discussLoading.value = false;
};

const loadCodeEditor = (description: string) => {
  discussEditForm.value.code = description;
  discussLoading.value = false;
};

const loadDiscuss = async () => {
  const res = await GetDiscuss(discussId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("problem get failed", res.code);
    await router.push({ name: "problem" });
    return;
  }

  const daily = res.data;

  discussData.value = ParseDiscuss(daily, {} as any);

  discussEditForm.value.problemId = daily.problem_id;

  loadSolutionEditor(daily.solution);
  loadCodeEditor(daily.code);
};

onMounted(async () => {
  watchHandle = watch(
    () => route.params,
    async () => {
      if (Array.isArray(route.params.dailyId)) {
        discussId.value = route.params.dailyId[0];
      } else {
        discussId.value = route.params.dailyId;
      }

      if (discussId.value) {
        discussLoading.value = true;
        discussEditForm.value.date = discussId.value;
        await loadDiscuss();
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
  <t-loading :loading="discussLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-form-card">
            <t-form :model="discussEditForm">
              <t-form-item label="标题">
                <t-input v-model="discussEditForm.title" placeholder="讨论标题"></t-input>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="discussId">
              <t-button @click="handleClickSave" theme="danger" :loading="isSaving">保存</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isSaving">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="discussId">
            <t-descriptions-item label="创建时间">{{ discussData?.createTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ discussData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ discussData?.creatorNickname }}</t-descriptions-item>
            <t-descriptions-item label="更新用户">{{ discussData?.updaterNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div class="dida-description-editor">
      <md-editor-v3
        id="discuss-editor"
        v-model="discussEditForm.content"
        @save="handleClickSave"
        @onUploadImg="handleUploadImg"
        previewTheme="cyanosis"
      ></md-editor-v3>
      <t-loading :loading="isSaving" attach="#discuss-editor" :z-index="100000"></t-loading>
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
}
</style>
