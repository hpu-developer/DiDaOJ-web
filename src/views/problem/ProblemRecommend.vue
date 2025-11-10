<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetProblemRecommend, ParseProblem, ProblemAttemptStatus } from "@/apis/problem.ts";
import { Problem, ProblemTag, ProblemView } from "@/types/problem.ts";
import { handleGotoProblem } from "@/util/router.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let watchHandle: WatchStopHandle | null = null;
let problemKey = "";

let tagsMap = {} as { [key: number]: ProblemTag };
let problemAttemptStatus = {} as { [key: string]: ProblemAttemptStatus };

const listColumns = ref([
  {
    title: "ID",
    colKey: "key",
    cell: (_: any, data: any) => {
      let theme = getProblemIdTheme(data.row.id);
      return (
        <t-button variant="dashed" theme={theme} onClick={() => handleGotoProblem(data.row.key)}>
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
        <t-button variant="text" onClick={() => handleGotoProblem(data.row.key)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "标签",
    colKey: "tags",
    cell: (_: any, data: any) => {
      const tags = data.row.tags;
      if (!tags || tags.length === 0) {
        return "";
      }
      let tagButtons = [];
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        tagButtons.push(
          <t-button key={i} theme="default" variant="outline" size="small" onClick={() => handleClickTag(tag)}>
            {tag.name}
          </t-button>
        );
      }
      return <t-space>{tagButtons}</t-space>;
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

const dataLoading = ref(false);

const problemViews = ref<ProblemView[]>();

const getProblemIdTheme = (id: string) => {
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

const handleClickTag = (tag: ProblemTag) => {
  if (!tag) {
    return;
  }
  router.push({
    name: "problem-list",
    query: {
      tag: tag.name,
    },
  });
};

const fetchData = async (needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const res = await GetProblemRecommend(problemKey);
    problemViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as Problem[];
      if (!responseList || responseList.length <= 0) {
        ShowTextTipsInfo(globalProperties, "暂无推荐题目");
        return;
      }
      tagsMap = {} as { [key: number]: ProblemTag };
      if (res.data.tags) {
        res.data.tags.forEach((tag: ProblemTag) => {
          tagsMap[tag.id] = tag;
        });
      }
      responseList.forEach((item) => {
        const result = ParseProblem(item, tagsMap);
        problemViews.value?.push(result);
      });
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
  }
};

// 初始化分页信息
onMounted(async () => {
  dataLoading.value = true;

  watchHandle = watch(
    () => route.query,
    (_: any) => {
      if (Array.isArray(route.params.problemKey)) {
        problemKey = route.params.problemKey[0];
      } else {
        problemKey = route.params.problemKey;
      }
      fetchData(true);
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-row>
    <t-col :span="9">
      <t-card style="margin: 10px">
        <t-table
          :data="problemViews"
          :columns="listColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          table-layout="auto"
          :loading="dataLoading"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card" header="题目推荐" :header-bordered="true">
          根据本站其他用户的提交记录推荐类似题目<br />依据推荐算法来计算，与本用户相似度最高的用户做的题，大概率被自己感兴趣。
        </t-card>
      </div>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}

.sh-background-black {
  background-color: #212121;
}

.sh-tag-button {
  margin: 2px;
}
</style>
