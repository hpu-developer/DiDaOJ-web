<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { GetDiscussEdit, GetDiscussImageToken, ParseDiscuss, PostDiscussCreate, PostDiscussEdit } from "@/apis/discuss.ts";
import { HandleR2ImageUpload, UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";
import type { WatchStopHandle } from "vue";
import type { Discuss, DiscussView } from "@/types/discuss.ts";
import type { DiscussEditRequest } from "@/types/discuss.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let watchHandle = null as WatchStopHandle | null;

const discussId = ref(0);
const discussLoading = ref(false);
const isSaving = ref(false);

const discussData = ref<DiscussView | null>(null);

const discussEditForm = ref({
  contestId: "",
  problemKey: "",
  title: "",
  content: "",
});

const handleClickView = () => {
  router.push({
    name: "discuss-detail",
    params: {
      discussId: discussId.value,
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
      content: discussEditForm.value.content,
      contest_id: Number(discussEditForm.value.contestId),
      problem_key: discussEditForm.value.problemKey,
    } as DiscussEditRequest;
    const res = await PostDiscussCreate(postData);

    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    const createDiscussId = res.data as number;

    await router.push({
      name: "discuss-detail",
      params: { discussId: createDiscussId },
    });

    ShowTextTipsSuccess(globalProperties, "创建成功");
  } finally {
    isSaving.value = false;
  }
};

const handleClickSave = async () => {
  isSaving.value = true;

  try {
    const postData = {
      id: discussId.value,
      title: discussEditForm.value.title,
      content: discussEditForm.value.content,
      contest_id: Number(discussEditForm.value.contestId),
      problem_key: discussEditForm.value.problemKey,
    } as DiscussEditRequest;
    const res = await PostDiscussEdit(postData);
    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (discussData.value) {
      if (res.data.modify_time != undefined) {
        discussData.value.modifyTime = new Date(res.data.modify_time).toLocaleString();
      }
    }
    if (res.data.content != undefined) {
      discussEditForm.value.content = res.data.content;
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const onEditSave = async () => {
  if (discussId.value) {
    await handleClickSave();
  } else {
    await handleClickCreate();
  }
};

const loadDiscuss = async () => {
  const res = await GetDiscussEdit(discussId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "discuss" });
    return;
  }

  const discuss = res.data.discuss as Discuss;

  discussData.value = ParseDiscuss(discuss);

  discussEditForm.value.title = discuss.title;
  discussEditForm.value.content = discuss.content;
  if (discuss.contest_id) {
    discussEditForm.value.contestId = discuss.contest_id.toString();
  } else {
    discussEditForm.value.contestId = "";
  }
  discussEditForm.value.problemKey = discuss.problem_key;

  discussLoading.value = false;
};

onMounted(async () => {
  watchHandle = watch(
    () => route.params,
    async () => {
      if (Array.isArray(route.params.discussId)) {
        discussId.value = Number(route.params.discussId[0]);
      } else {
        discussId.value = Number(route.params.discussId);
      }

      if (discussId.value) {
        discussLoading.value = true;
        await loadDiscuss();
      } else {
        discussEditForm.value.title = "";
        discussEditForm.value.contestId = "";
        discussEditForm.value.problemKey = "";
        discussEditForm.value.content = "";

        if (route.query.contest_id) {
          discussEditForm.value.contestId = route.query.contest_id as string;
        } else {
          discussEditForm.value.contestId = "";
        }
        if (route.query.problem_key) {
          discussEditForm.value.problemKey = route.query.problem_key as string;
        } else {
          discussEditForm.value.problemKey = "";
        }
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
              <t-form-item label="关联比赛">
                <t-input v-model="discussEditForm.contestId" placeholder="比赛标识"></t-input>
              </t-form-item>
              <t-form-item label="关联题目">
                <t-input v-model="discussEditForm.problemKey" placeholder="讨论题目"></t-input>
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
            <t-descriptions-item label="创建时间">{{ discussData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ discussData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ discussData?.inserterNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div class="dida-description-editor">
      <md-editor-v3
        id="discuss-editor"
        v-model="discussEditForm.content"
        @save="onEditSave"
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
