<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, ShowErrorTips } from "@/util/tips";
import {
  GetJudgeJob,
  GetJudgeStatusStr,
  GetJudgeStatusTheme,
  GetJudgeStatusTips,
  IsJudgeStatusRunning,
  JudgeStatus,
  ParseJudgeJob,
  PostJudgeJobPrivate,
  PostRejudgeJob,
} from "@/apis/judge.ts";
import { GetJudgeLanguageStr, GetHighlightKeyByJudgeLanguage } from "@/apis/language.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";
import type { ButtonProps } from "tdesign-vue-next";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";
import { handleGotoContestProblem } from "@/util/router.ts";
import { GetAvatarUrl } from "@/util/avatar.ts";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let refreshTimeout: ReturnType<typeof setTimeout>;
let judgeId = 0;
let contestId = 0;
const judgerName = ref("");
const judgeJob = ref<JudgeJobView | null>(null);
const judgeJobCode = ref("");
const jobProgress = ref(0);
const jobProgressStatus = ref(null as null | string);
const jobProgressToColor = ref({
  from: "#5a96ff",
  to: "#00A870",
});

const ListColumns = ref([
  {
    title: "ID",
    colKey: "id",
  },
  {
    title: "问题",
    colKey: "problemKey",
    cell: (_: any, data: any) => {
      if (contestId) {
        return (
          <t-button variant="text" onClick={() => handleGotoContestProblem(contestId, data.row.contestProblemIndex)}>
            {GetContestProblemIndexStr(data.row.contestProblemIndex)}
          </t-button>
        );
      }
      return (
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.problemKey)}>
          {data.row.problemKey}
        </t-button>
      );
    },
  },
  {
    title: "状态",
    colKey: "status",
    align: "center",
    cell: (_: any, data: any) => {
      const status = data.row.status as JudgeStatus;
      const statusStr = GetJudgeStatusStr(status);
      const theme = GetJudgeStatusTheme(status);
      let finalElements = [];
      if (IsJudgeStatusRunning(status)) {
        finalElements.push(<t-loading text={data.row.state} size="small" class="dida-status-loading"></t-loading>);
      }
      finalElements.push(<span>{statusStr}</span>);
      return (
        <t-button theme={theme} variant="outline">
          {finalElements}
        </t-button>
      );
    },
  },
  {
    title: "分数",
    colKey: "score",
  },
  {
    title: "时间",
    colKey: "time",
  },
  {
    title: "内存",
    colKey: "memory",
  },
  {
    title: "代码",
    colKey: "language",
    cell: (_: any, data: any) => {
      return <span>{GetJudgeLanguageStr(data.row.language) + " / " + data.row.codeLength}</span>;
    },
  },
  {
    title: "作者",
    colKey: "inserter",
    width: 200,
    cell: (_: any, data: any) => {
      const avatarUrl = GetAvatarUrl(data.row.inserterUsername, data.row.inserterEmail);
      return (
        <t-space>
          <t-avatar shape="round" size="32px" image={avatarUrl} hide-on-load-failed={false} />
          <t-button variant="text" onClick={() => handleGotoUser(data.row.inserterUsername)}>
            {data.row.inserterNickname}
          </t-button>
        </t-space>
      );
    },
  },
  {
    title: "提交时间",
    colKey: "insertTime",
    width: 180,
  },
]);

const dataLoading = ref(false);
const isRejudging = ref(false);
const isPrivate = ref(false);
const isPrivateLoading = ref(false);

const judgeJobViews = ref<JudgeJobView[]>();

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageJudge);
});

const hasEditPrivateAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageJudge) || (judgeJob.value && userStore.getUserId == judgeJob.value.inserter);
});

const handleClickRejudge = async () => {
  if (isRejudging.value) {
    return;
  }
  isRejudging.value = true;
  try {
    const res = await PostRejudgeJob(judgeId);
    if (res.code === 0) {
      await fetchData(true);
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    isRejudging.value = false;
  }
};

const handleGotoProblem = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ path: "/problem/" + id });
};

const handleGotoUser = (user: string) => {
  if (!user) {
    return;
  }
  router.push({ path: "/user/" + user });
};

const taskRender = (task: any) => {
  const status = task.status as JudgeStatus;
  const statusStr = GetJudgeStatusStr(status);
  let theme: ButtonProps["theme"];
  switch (status) {
    case JudgeStatus.Init:
    case JudgeStatus.Rejudge:
    case JudgeStatus.Compiling:
    case JudgeStatus.Running:
      theme = "default";
      break;
    case JudgeStatus.Accept:
      theme = "success";
      break;
    case JudgeStatus.PE:
      theme = "warning";
      break;
    default:
      theme = "danger";
      break;
  }
  return (
    <t-space>
      <t-button theme="default" variant="outline">
        {task.taskId}
      </t-button>
      <t-button theme={theme} variant="outline">
        {statusStr}
      </t-button>
      <span>分数：{task.score}</span>
      <span>用时：{task.time}</span>
      <span>内存：{task.memory}</span>
    </t-space>
  );
};

const handlePrivateChanged = async (value: boolean) => {
  isPrivateLoading.value = true;
  try {
    const res = await PostJudgeJobPrivate(judgeId, value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    isPrivate.value = value;
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    isPrivateLoading.value = false;
  }
};

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  let needRefresh = false;
  try {
    const res = await GetJudgeJob(judgeId, contestId);
    judgeJobViews.value = [];
    if (res.code === 0) {
      const response = res.data as JudgeJob;
      const result = ParseJudgeJob(response);
      judgeJobViews.value?.push(result);

      judgerName.value = result.judgerName;

      jobProgressToColor.value.to = "#00A870";

      if (IsJudgeStatusRunning(response.status)) {
        jobProgressStatus.value = "active";
        if (result.taskTotal > 0) {
          jobProgress.value = Number(((result.taskCurrent / result.taskTotal) * 100).toFixed(2));
          if (result.taskCurrent >= result.taskTotal) {
            jobProgress.value = 99;
          }
        } else {
          jobProgress.value = 0;
        }
      } else {
        jobProgress.value = 100;
        if (response.status === JudgeStatus.Accept) {
          jobProgressStatus.value = "success";
        } else if (response.status === JudgeStatus.PE) {
          jobProgressToColor.value.to = "#F57C20";
          jobProgressStatus.value = "warning";
        } else {
          jobProgressToColor.value.to = "#F56C6C";
          jobProgressStatus.value = "error";
        }
      }

      if (response.code) {
        const language = GetHighlightKeyByJudgeLanguage(response.language);
        judgeJobCode.value = `\`\`\`${language}\n${response.code}\n\`\`\``;
      }

      judgeJob.value = result;

      isPrivate.value = judgeJob.value.private;

      if (IsJudgeStatusRunning(response.status)) {
        needRefresh = true;
      }
    } else {
      if (needLoading) {
        ShowErrorTips(globalProperties, res.code);
      }
      if (contestId) {
        await router.push({ name: "contest-judge", params: { contestId } });
      } else {
        await router.push({ name: "judge-list" });
      }
    }
  } catch (err) {
    console.error(err);
    if (needLoading) {
      ShowErrorTips(globalProperties, GetCommonErrorCode());
    }
  } finally {
    if (needLoading) {
      dataLoading.value = false;
    }
    if (needRefresh && viewActive) {
      refreshTimeout = setTimeout(() => {
        fetchData(false);
      }, 5000);
    }
  }
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  if (Array.isArray(route.params.judgeId)) {
    judgeId = Number(route.params.judgeId[0]);
  } else {
    judgeId = Number(route.params.judgeId);
  }

  if (Array.isArray(route.params.contestId)) {
    contestId = Number(route.params.contestId[0]);
  } else {
    contestId = Number(route.params.contestId);
  }

  if (!judgeId) {
    await router.push({ name: "judge" });
    return;
  }

  await fetchData(true);
});

onBeforeUnmount(() => {
  viewActive = false;
  clearTimeout(refreshTimeout);
});
</script>

<template>
  <t-progress :color="jobProgressToColor" :status="jobProgressStatus" class="dida-job-progress" :percentage="jobProgress" />

  <t-card style="margin: 10px">
    <t-table :data="judgeJobViews" :columns="ListColumns" row-key="id" vertical-align="top" :hover="true" :loading="dataLoading" />
  </t-card>

  <t-row>
    <t-col :span="8">
      <div class="dida-code-container">
        <md-preview :model-value="judgeJobCode" class="dida-code-div"></md-preview>
      </div>
    </t-col>
    <t-col :span="4">
      <div style="margin: 20px">
        <t-descriptions layout="vertical" :bordered="true">
          <t-descriptions-item label="判题机">{{ judgerName }}</t-descriptions-item>
          <t-descriptions-item label="判题时间">{{ judgeJob?.judgeTime }}</t-descriptions-item>
        </t-descriptions>
        <t-card style="margin: 10px 0" v-if="hasEditPrivateAuth">
          <t-form layout="inline">
            <t-form-item label="是否隐藏代码">
              <t-switch v-model="isPrivate" :loading="dataLoading || isPrivateLoading" @change="handlePrivateChanged"></t-switch>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="dida-card-tips">
          {{ dataLoading ? "数据正在加载，请等待" : GetJudgeStatusTips(judgeJob?.status) }}
        </t-card>
      </div>
    </t-col>
  </t-row>

  <t-card v-if="judgeJob?.compileMessage" class="compile-message">{{ judgeJob?.compileMessage }}</t-card>

  <t-collapse v-if="judgeJob?.task && judgeJob?.task.length > 0" class="task-panel">
    <t-collapse-panel v-for="(task, _) in judgeJob?.task" :key="task.taskId" :header="() => taskRender(task)">
      <t-card>
        {{ GetJudgeStatusTips(task.status) }}
      </t-card>
      <t-card v-if="task.content" class="dida-card-tips">
        <md-preview :model-value="task.content"></md-preview>
      </t-card>
      <t-card v-if="task.hint" class="dida-card-tips">
        <md-preview :model-value="task.hint"></md-preview>
      </t-card>
    </t-collapse-panel>
  </t-collapse>
  <div class="dida-edit-container" v-if="hasEditAuth">
    <t-button @click="handleClickRejudge" :loading="isRejudging">重新评测</t-button>
  </div>
</template>

<style scoped>
:deep(.dida-status-loading) {
  margin-right: 5px;
}

.compile-message {
  white-space: pre-wrap;
  margin: 0 20px;
}

.task-panel {
  margin: 20px;
}

.dida-edit-container {
  margin: 10px 20px;
  text-align: right;
}

.dida-job-progress {
  margin: 20px;
}

.dida-code-container {
  width: 100%;
  margin: 10px;
}

.dida-card-tips {
  margin-top: 10px;
}
</style>
