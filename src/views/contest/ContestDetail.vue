<script setup lang="tsx">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetContest, GetContestMemberSelf, ParseContest, PostContestDolos, PostContestMemberEditSelf, PostContestPassword } from "@/apis/contest.ts";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo } from "@/util/tips";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { handleGotoContestProblem } from "@/util/router.ts";
import type { ContestMemberEditRequest, ContestView } from "@/types/contest.ts";
import type { ProblemView } from "@/types/problem.ts";
import { ProblemAttemptStatus } from "@/apis/problem.ts";
import Countdown from "@/components/count-down/Countdown.vue";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

const dolosLoading = ref(false);

let contestId = 0;
const contestLoading = ref(false);
const contestData = ref<ContestView | null>(null);
const serverNow = ref(new Date());

const hasContestViewAuth = ref(false);
const needContestPassword = ref(false);
const contestPassword = ref("");

const contestCountdownTarget = ref(null as Date | null);
const showEditContestMemberDialog = ref(false);
const editContestMemberLoading = ref(false);
const contestName = ref("");

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageContest) || (contestData.value && userStore?.getUserId === contestData.value.inserter);
});

const isContestEnded = computed(() => {
  if (!contestData.value) return false;
  return serverNow.value > new Date(contestData.value.endTime);
});

const getProblemIdTheme = (id: number) => {
  if (!id) {
    return "default";
  }
  if (!problemAttemptStatus) {
    return "default";
  }
  const status = problemAttemptStatus[id];
  if (!status) {
    return "default";
  }
  switch (status) {
    case ProblemAttemptStatus.Accept:
      return "success";
    case ProblemAttemptStatus.Attempt:
      return "warning";
    default:
      return "default";
  }
};

const listColumns = ref([
  {
    title: "问题标识",
    colKey: "index",
    cell: (_: any, data: any) => {
      const theme = getProblemIdTheme(data.row.index);
      return (
        <t-button variant="dashed" theme={theme} onClick={async () => await handleGotoContestProblem(contestId, data.row.index)}>
          {data.row.key}
        </t-button>
      );
    },
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={async () => await handleGotoContestProblem(contestId, data.row.index)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "正确",
    colKey: "accept",
  },
  {
    title: "提交",
    colKey: "attempt",
  },
]);

const problemViews = ref<ProblemView[]>([]);

let problemAttemptStatus = {} as { [key: number]: ProblemAttemptStatus };
let passwordSubmitting = ref(false);

const handleContestCountdownEnd = async () => {
  await fetchContestData();
};

const handleClickEdit = () => {
  router.push({ name: "contest-edit", params: { contestId: contestId } });
};

const handleClickDolos = async () => {
  dolosLoading.value = true;
  try {
    const res = await PostContestDolos(contestId);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    const url = res.data;
    ShowTextTipsInfo(globalProperties, "查重报告已生成，请前往查看");
    window.open(url, "_blank");
  } finally {
    dolosLoading.value = false;
  }
};

const handlePostContestPassword = async () => {
  if (!userStore.isLogin()) {
    await router.push({ name: "login" });
    return;
  }
  if (!contestPassword.value) {
    ShowTextTipsError(globalProperties, "请输入密码");
    return;
  }
  passwordSubmitting.value = true;
  try {
    const res = await PostContestPassword(contestId, contestPassword.value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "申请访问成功");
    await fetchContestData();
  } catch (error) {
    console.error("Error submitting contest password:", error);
    ShowErrorTips(globalProperties, "提交密码失败，请稍后再试");
  } finally {
    passwordSubmitting.value = false;
  }
};

const handleEditContestMember = async () => {
  editContestMemberLoading.value = true;
  try {
    const res = await GetContestMemberSelf(contestId);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    if (res.data && res.data.contest_name) {
      contestName.value = res.data.contest_name;
    } else {
      contestName.value = "";
    }
  } finally {
    editContestMemberLoading.value = false;
    showEditContestMemberDialog.value = true;
  }
};

const handleClickClone = async () => {
  router.push({ name: "contest-create", query: { contest_id: contestId } });
};

const handleEditContestMemberSubmit = async () => {
  editContestMemberLoading.value = true;
  try {
    const res = await PostContestMemberEditSelf({
      id: contestId,
      contest_name: contestName.value,
    } as ContestMemberEditRequest);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "修改成功");
  } finally {
    editContestMemberLoading.value = false;
    showEditContestMemberDialog.value = false;
  }
};

const fetchContestData = async () => {
  contestLoading.value = true;

  const res = await GetContest(contestId);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
    return;
  }

  hasContestViewAuth.value = res.data.has_auth;
  needContestPassword.value = res.data.need_password;

  contestCountdownTarget.value = null;
  serverNow.value = new Date(res.data.now);
  if (serverNow.value < new Date(res.data.contest.start_time)) {
    const offset = new Date().getTime() - serverNow.value.getTime();
    contestCountdownTarget.value = new Date(new Date(res.data.contest.start_time).getTime() + offset);
  }

  contestData.value = ParseContest(res.data.contest);
  problemViews.value = contestData.value.problems;

  problemAttemptStatus = res.data.attempt_status || {};

  webStyleStore.setTitle(contestData.value.title + " - " + webStyleStore.getTitle);

  contestLoading.value = false;
};

onMounted(async () => {
  if (Array.isArray(route.params.contestId)) {
    contestId = Number(route.params.contestId[0]);
  } else {
    contestId = Number(route.params.contestId);
  }
  if (!contestId) {
    await router.push({ name: "contest" });
    return;
  }

  await fetchContestData();
});
</script>

<template>
  <t-loading :loading="contestLoading">
    <t-row class="dida-main-content">
      <t-col :span="6">
        <div style="margin: 20px">
          <h1>{{ contestData?.title }}</h1>
          <t-alert v-if="contestData?.notification" theme="info" :message="contestData?.notification" />
        </div>
        <div style="margin: 10px">
          <t-card v-if="hasContestViewAuth">
            <div class="dida-countdown-div" v-if="contestCountdownTarget">
              <p class="dida-countdown-head">比赛开启倒计时</p>
              <Countdown class="dida-countdown-content" :target="contestCountdownTarget" @on-end="handleContestCountdownEnd"></Countdown>
            </div>
            <t-table v-else :data="problemViews" :columns="listColumns" row-key="id" table-layout="auto" vertical-align="top" :hover="true" />
          </t-card>
          <t-card v-else>
            <div style="text-align: center; align-content: center; padding: 20px; height: 500px">
              <t-alert theme="warning" message="您没有查看本比赛的权限" />
              <t-form v-if="needContestPassword" style="margin: 20px auto 0; width: 200px" @submit="handlePostContestPassword" label-width="0">
                <t-form-item>
                  <t-input
                    placeholder="请输入密码"
                    v-model:value="contestPassword"
                    style="width: 300px"
                    type="password"
                    autocomplete="new-password"
                  />
                </t-form-item>
                <t-form-item>
                  <div style="text-align: center; width: 100%">
                    <t-button theme="primary" type="submit" :loading="passwordSubmitting">提交</t-button>
                  </div>
                </t-form-item>
              </t-form>
            </div>
          </t-card>
        </div>
      </t-col>
      <t-col :span="6">
        <div class="dida-operation-container">
          <t-space>
            <t-button v-if="hasEditAuth" @click="handleClickDolos" :loading="dolosLoading">查重</t-button>
            <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
            <t-button @click="handleEditContestMember" :loading="editContestMemberLoading">参赛信息</t-button>
            <t-button v-if="isContestEnded" @click="handleClickClone" theme="warning">克隆</t-button>
          </t-space>
        </div>
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="创建时间">{{ contestData?.insertTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="编辑时间">{{ contestData?.modifyTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="开始时间">{{ contestData?.startTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="结束时间">{{ contestData?.endTime }}</t-descriptions-item>
          </t-descriptions>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="结束后提交">{{ contestData?.submitAnytime ? "允许" : "禁止" }}</t-descriptions-item>
          </t-descriptions>
        </div>
        <t-card style="margin: 12px" v-if="contestData?.description">
          <md-preview :model-value="contestData?.description" class="dida-content-description"></md-preview>
        </t-card>
      </t-col>
    </t-row>
  </t-loading>

  <t-dialog
    v-model:visible="showEditContestMemberDialog"
    header="参赛信息"
    @confirm="handleEditContestMemberSubmit"
    :confirm-loading="editContestMemberLoading"
  >
    <div style="margin-bottom: 10px">
      <t-form ref="contestMemberFormRef">
        <t-form-item label="参赛昵称" prop="nickname">
          <t-input v-model:value="contestName" placeholder="留空则取用户昵称" />
        </t-form-item>
      </t-form>
    </div>
  </t-dialog>
</template>

<style scoped>
.dida-operation-container {
  margin: 20px 12px 20px;
  text-align: right;
}

.dida-countdown-div {
  text-align: center;
  align-content: center;
  margin: 20px auto;
  height: 300px;
}

.dida-countdown-head {
  font-size: 32px;
}

.dida-countdown-content {
  font-size: 24px;
}
</style>
