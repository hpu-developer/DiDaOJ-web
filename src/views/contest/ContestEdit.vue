<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetContestEdit, GetContestImageToken, ParseContest, PostContestCreate, PostContestEdit } from "@/apis/contest.ts";
import { ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { ContestEditRequest, ContestView } from "@/types/contest.ts";
import ParseProblemList from "@/components/problem/ParseProblemList.vue";
import ParseUserList from "@/components/user/ParseUserList.vue";
import { GetSecondFromDuration, GetTimeStringBySeconds } from "@/time/library.ts";
import { HandleR2ImageUpload, UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const contestId = ref(0);
const contestLoading = ref(false);
const isSaving = ref(false);
const editTab = ref("1");

const showDialog = ref(false);

const contestData = ref<ContestView | null>(null);

const contestEditForm = ref({
  title: "",
  openTime: [] as (Date | string)[],
  private: true,
  password: "",
  problems: [] as number[],
  members: [] as number[],
  description: "",
  notification: "",
  lockRankDuration: 0,
  alwaysLock: true,
  submitAnytime: false,
});

const parseDialogTitle = ref<string>("");
const textareaValue = ref("");
let parseFunction = null as (() => Promise<void>) | null;
const isParsing = ref(false);

const handleParse = async () => {
  isParsing.value = true;
  if (parseFunction) {
    await parseFunction();
  }
  showDialog.value = false;
  isParsing.value = false;
};

const handleUploadImg = async (files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) => {
  isSaving.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, () => {
    return GetContestImageToken(contestId.value);
  });
  isSaving.value = false;
};

const handleClickCreate = async () => {
  isSaving.value = true;

  try {
    const postData = {
      title: contestEditForm.value.title,
      description: contestEditForm.value.description,
      notification: contestEditForm.value.notification,
      lock_rank_duration: contestEditForm.value.lockRankDuration,
      always_lock: contestEditForm.value.alwaysLock,
      problems: contestEditForm.value.problems,
      members: contestEditForm.value.members,
      private: contestEditForm.value.private,
      password: contestEditForm.value.password,
      submit_anytime: contestEditForm.value.submitAnytime,
    } as ContestEditRequest;
    if (contestEditForm.value.openTime[0]) {
      postData.start_time = new Date(contestEditForm.value.openTime[0]);
    }
    if (contestEditForm.value.openTime[1]) {
      postData.end_time = new Date(contestEditForm.value.openTime[1]);
    }
    const res = await PostContestCreate(postData);

    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      await router.push({
        name: "contest-detail",
        params: { contestId: res.data },
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
    const postData = {
      id: Number(contestId.value),
      title: contestEditForm.value.title,
      notification: contestEditForm.value.notification,
      lock_rank_duration: contestEditForm.value.lockRankDuration,
      always_lock: contestEditForm.value.alwaysLock,
      problems: contestEditForm.value.problems,
      members: contestEditForm.value.members,
      private: contestEditForm.value.private,
      password: contestEditForm.value.password,
      submit_anytime: contestEditForm.value.submitAnytime,
      description: contestEditForm.value.description,
    } as ContestEditRequest;
    if (contestEditForm.value.openTime[0]) {
      postData.start_time = new Date(contestEditForm.value.openTime[0]);
    }
    if (contestEditForm.value.openTime[1]) {
      postData.end_time = new Date(contestEditForm.value.openTime[1]);
    }
    const res = await PostContestEdit(postData);

    isSaving.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (contestData.value) {
      if (res.data.description != undefined) {
        contestEditForm.value.description = res.data.description;
      }
      if (res.data.update_time != undefined) {
        contestData.value.modifyTime = new Date(res.data.update_time).toLocaleString();
      }
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const loadDescriptionEditor = (description: string) => {
  contestEditForm.value.description = description;
  contestLoading.value = false;
};

const loadContest = async () => {
  const res = await GetContestEdit(contestId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("contest get failed", res.code);
    await router.push({ name: "contest-list" });
    return;
  }

  const contest = res.data.contest;

  contestData.value = ParseContest(contest);

  contestEditForm.value.title = contest.title;
  contestEditForm.value.openTime = [] as (Date | string)[];
  if (contest.start_time) {
    contestEditForm.value.openTime.push(new Date(contest.start_time));
  } else {
    contestEditForm.value.openTime.push(""); // 默认开始时间为当前时间
  }
  if (contest.end_time) {
    contestEditForm.value.openTime.push(new Date(contest.end_time));
  } else {
    contestEditForm.value.openTime.push(""); // 默认结束时间为当前时间加一天
  }
  contestEditForm.value.private = contest.private;
  contestEditForm.value.password = contest.password || "";
  contestEditForm.value.description = contest.description || "";
  contestEditForm.value.notification = contest.notification || "";

  contestEditForm.value.problems = contest.problems;
  contestEditForm.value.members = res.data.members;

  if (contest.lock_rank_duration) {
    contestEditForm.value.lockRankDuration = GetSecondFromDuration(contest.lock_rank_duration);
  } else {
    contestEditForm.value.lockRankDuration = 0;
  }
  contestEditForm.value.alwaysLock = contest.always_lock;

  contestEditForm.value.submitAnytime = contest.submit_anytime;

  webStyleStore.setTitle(contest.title + " - " + webStyleStore.getTitle);

  let contestDescription = "";
  if (contest.description) {
    contestDescription = contest.description as string;
  }

  loadDescriptionEditor(contestDescription);
};

onMounted(async () => {
  if (Array.isArray(route.params.contestId)) {
    contestId.value = Number(route.params.contestId[0]);
  } else {
    contestId.value = Number(route.params.contestId);
  }

  if (contestId.value) {
    contestLoading.value = true;
    await loadContest();
  } else {
    loadDescriptionEditor("");
  }
});
</script>

<template>
  <t-loading :loading="contestLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-card">
            <t-tabs v-model="editTab">
              <t-tab-panel value="1" label="基础信息" style="padding: 10px">
                <t-form :model="contestEditForm" label-width="150px">
                  <t-form-item label="标题">
                    <t-input v-model="contestEditForm.title" placeholder="比赛标题"></t-input>
                  </t-form-item>
                  <t-form-item label="通知">
                    <t-input v-model="contestEditForm.notification" placeholder="会更为醒目地提醒"></t-input>
                  </t-form-item>
                  <t-form-item label="开启时间">
                    <t-date-range-picker
                      v-model="contestEditForm.openTime"
                      allow-input
                      clearable
                      format="YYYY-MM-DD HH:mm:ss"
                      :default-time="['00:00:00', '23:59:59']"
                    />
                  </t-form-item>
                  <t-form-item label="提交限制">
                    <t-switch v-model="contestEditForm.submitAnytime">
                      <template #label="slotProps">{{ slotProps.value ? "结束仍能提交" : "仅比赛期间提交" }}</template>
                    </t-switch>
                  </t-form-item>

                  <t-form-item label="锁榜时长">
                    <t-input-number v-model="contestEditForm.lockRankDuration" :min="0" :format="GetTimeStringBySeconds" auto-width></t-input-number>
                  </t-form-item>
                  <t-form-item label="自动解锁">
                    <t-switch v-model="contestEditForm.alwaysLock">
                      <template #label="slotProps">{{ slotProps.value ? "结束后仍锁榜" : "结束后解锁" }}</template>
                    </t-switch>
                  </t-form-item>

                  <t-form-item label="私有">
                    <t-switch v-model="contestEditForm.private" />
                  </t-form-item>
                  <t-form-item label="密码" v-if="contestEditForm.private">
                    <t-input v-model="contestEditForm.password" type="password" autocomplete="current-password" placeholder="请输入访问密码，留空代表关闭密码访问"></t-input>
                  </t-form-item>
                </t-form>
              </t-tab-panel>
              <t-tab-panel value="2" label="问题" style="padding: 10px">
                <ParseProblemList v-model="contestEditForm.problems" />
              </t-tab-panel>
              <t-tab-panel v-if="contestEditForm.private" value="3" label="成员" style="padding: 10px">
                <ParseUserList v-model="contestEditForm.members" />
              </t-tab-panel>
            </t-tabs>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="contestId">
              <t-button @click="handleClickSave" theme="danger" :loading="isSaving">保存</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isSaving">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="contestId">
            <t-descriptions-item label="创建时间">{{ contestData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ contestData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ contestData?.inserterNickname }}</t-descriptions-item>
            <t-descriptions-item label="编辑用户">{{ contestData?.modifierNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div class="dida-description-editor">
      <p>公告</p>
      <md-editor-v3
        id="contest-description-editor"
        v-model="contestEditForm.description"
        @save="handleClickSave"
        @onUploadImg="handleUploadImg"
        previewTheme="cyanosis"
      />
      <t-loading :loading="isSaving" attach="#contest-description-editor" :z-index="100000"></t-loading>
    </div>
  </t-loading>
  <t-dialog v-model:visible="showDialog" @confirm="handleParse" :header="parseDialogTitle" :confirm-loading="isParsing">
    <div style="margin-bottom: 10px">
      <span>多条请换行隔开</span>
    </div>
    <t-textarea v-model="textareaValue" :autosize="{ minRows: 5 }"></t-textarea>
  </t-dialog>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-description-editor {
  margin: 10px;
}
</style>
