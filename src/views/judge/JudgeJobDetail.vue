<script setup lang="tsx">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import {
  GetJudgeJob,
  GetJudgeStatusStr,
  GetJudgeStatusTheme,
  IsJudgeStatusRunning,
  JudgeStatus,
  ParseJudgeJob,
  PostRejudgeJob,
} from "@/apis/judge.ts";
import { GetKeyByJudgeLanguage } from "@/apis/language.ts";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";
import type { ButtonProps } from "tdesign-vue-next";
import Vditor from "vditor";
import { AuthType } from "@/auth";
import { useUserStore } from "@/stores/user.ts";
import { GetJudgerStatus } from "@/apis/system.ts";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let refreshTimeout: ReturnType<typeof setTimeout>;
let judgeId = -1;
const judgerName = ref("");
const judgeJob = ref<JudgeJobView | null>(null);
const judgeJobCode = ref("");
const markdownCodeRef = ref<HTMLElement | null>(null);
const jobProgress = ref(0);
const jobProgressStatus = ref(null as null | string);
const jobProgressToColor = ref({
  from: "#5a96ff",
  to: "#00A870",
});
let isInitHighlight = false;

const ListColumns = ref([
  {
    title: "ID",
    colKey: "id",
  },
  {
    title: "问题",
    colKey: "problemId",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.problemId)}>
          {data.row.problemId}
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
      return <span>{data.row.language + " / " + data.row.codeLength}</span>;
    },
  },
  {
    title: "作者",
    colKey: "author",
    width: 200,
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoUser(data.row.authorUsername)}>
          {data.row.authorNickname}
        </t-button>
      );
    },
  },
  {
    title: "提交时间",
    colKey: "approveTime",
    width: 180,
  },
]);

const dataLoading = ref(false);
const isRejudging = ref(false);

const judgeJobViews = ref<JudgeJobView[]>();

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageJudge);
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

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  let needRefresh = false;
  try {
    const res = await GetJudgeJob(judgeId);
    judgeJobViews.value = [];
    if (res.code === 0) {
      const response = res.data as JudgeJob;
      const result = ParseJudgeJob(response);
      judgeJobViews.value?.push(result);

      if (response.judger) {
        const judgerStatus = await GetJudgerStatus(response.judger);
        judgerName.value = judgerStatus.name;
      } else {
        judgerName.value = "";
      }

      jobProgressToColor.value.to = "#00A870";

      if (IsJudgeStatusRunning(response.status)) {
        jobProgressStatus.value = "active";
        if (result.taskTotal > 0) {
          jobProgress.value = (result.taskCurrent / result.taskTotal) * 100;
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

      const options = {} as IPreviewOptions;
      if (response.code) {
        const language = GetKeyByJudgeLanguage(response.language);
        const codeMarkdown = `\`\`\`${language}\n${response.code}\n\`\`\``;
        judgeJobCode.value = await Vditor.md2html(codeMarkdown, options);

        await nextTick(() => {
          if (markdownCodeRef.value) {
            if (!isInitHighlight) {
              isInitHighlight = true;
              Vditor.highlightRender({ lineNumber: true, enable: true }, markdownCodeRef.value);
            }
            enhanceCodeCopy(markdownCodeRef.value);
          }
        });
      }

      judgeJob.value = result;

      if (IsJudgeStatusRunning(response.status)) {
        needRefresh = true;
      }
    } else {
      if (needLoading) {
        ShowErrorTips(globalProperties, res.code);
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
    judgeId = route.params.judgeId[0];
  } else {
    judgeId = route.params.judgeId;
  }

  if (!judgeId) {
    await router.push({ name: "judge" });
    return;
  }

  await fetchData(true);
});

onBeforeUnmount(() => {
  viewActive = false;
});
</script>

<template>
  <t-progress :color="jobProgressToColor" :status="jobProgressStatus" class="dida-job-progress" :percentage="jobProgress" />

  <t-card style="margin: 10px">
    <t-table :data="judgeJobViews" :columns="ListColumns" row-key="id" vertical-align="top" :hover="true" :loading="dataLoading" />
  </t-card>

  <t-row>
    <t-col :span="8">
      <div v-html="judgeJobCode" ref="markdownCodeRef"></div>
    </t-col>
    <t-col :span="4">
      <t-descriptions layout="vertical" :bordered="true" style="margin: 10px">
        <t-descriptions-item label="判题机">{{ judgerName }}</t-descriptions-item>
        <t-descriptions-item label="判题时间">{{ judgeJob?.judgeTime }}</t-descriptions-item>
      </t-descriptions>
    </t-col>
  </t-row>

  <t-card v-if="judgeJob?.compileMessage" class="compile-message">{{ judgeJob?.compileMessage }}</t-card>

  <t-collapse v-if="judgeJob?.task.length > 0" class="task-panel">
    <t-collapse-panel v-for="(task, index) in judgeJob?.task" :key="task.taskId" :header="() => taskRender(task)">
      {{ task.content }}
      {{ task.waHint }}
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
</style>
