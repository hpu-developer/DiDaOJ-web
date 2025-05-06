<script setup lang="tsx">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, useCurrentInstance } from "@/util";
import { GetJudgeJob, GetJudgeStatusStr, IsJudgeStatusRunning, JudgeStatus, ParseJudgeJob } from "@/apis/judge.ts";
import { GetKeyByJudgeLanguage } from "@/apis/language.ts";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import type { JudgeJob, JudgeJobView } from "@/types/judge.ts";
import type { ButtonProps } from "tdesign-vue-next";
import Vditor from "vditor";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let refreshTimeout: ReturnType<typeof setTimeout>;
let judgeId = -1;
const judgeJob = ref<JudgeJobView | null>(null);
const judgeJobCode = ref("");
const markdownCodeRef = ref<HTMLElement | null>(null);

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
    title: "作者",
    colKey: "author",
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

const judgeJobViews = ref<JudgeJobView[]>();

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

      const options = {} as IPreviewOptions;
      if (response.code) {
        const language = GetKeyByJudgeLanguage(response.language);
        const codeMarkdown = `\`\`\`${language}\n${response.code}\n\`\`\``;
        judgeJobCode.value = await Vditor.md2html(codeMarkdown, options);
        await nextTick(() => {
          if (markdownCodeRef.value) {
            Vditor.highlightRender({ lineNumber: true, enable: true }, markdownCodeRef.value);

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

  if (route.params.judgeId && route.params.judgeId.length === 1) {
    judgeId = parseInt(route.params.judgeId[0] as string);
  } else {
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
  <t-card style="margin: 10px">
    <t-table :data="judgeJobViews" :columns="ListColumns" row-key="id" vertical-align="top" :hover="true" :loading="dataLoading" />
  </t-card>

  <div v-html="judgeJobCode" ref="markdownCodeRef"></div>

  <t-card v-if="judgeJob?.compileMessage" class="compile-message">{{ judgeJob?.compileMessage }}</t-card>

  <t-collapse v-if="judgeJob?.task.length > 0" class="task-panel">
    <t-collapse-panel v-for="task in judgeJob?.task" :key="task.taskId" :header="() => taskRender(task)">
      {{ task.content }}
      {{ task.waHint }}
    </t-collapse-panel>
  </t-collapse>
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
</style>
