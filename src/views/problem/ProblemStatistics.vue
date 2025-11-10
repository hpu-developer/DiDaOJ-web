<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.ts";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetProblemRank, GetProblemRankTypes, GetProblemStatistics, ParseProblemRank, ProblemRankType } from "@/apis/problem.ts";
import type { ProblemRank, ProblemRankView } from "@/types/rank.ts";
import { GetAvatarUrl } from "@/util/avatar.ts";
import { handleGotoJudgeJob, handleGotoJudgeList, handleGotoProblem, handleGotoProblemList, handleGotoUsername } from "@/util/router.ts";
import { GetHighlightKeyByJudgeLanguage, GetJudgeLanguageStr, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import type { JudgeJobView } from "@/types/judge.ts";
import { GetJudgeJobCode, GetJudgeStatusColor, GetJudgeStatusStr, JudgeStatus } from "@/apis/judge.ts";

import * as echarts from "echarts/core";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { PieChart } from "echarts/charts";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer, LabelLayout]);

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let watchHandle: WatchStopHandle | null = null;

const problemKey = ref("");

let isError = false;
const staticsLoading = ref(false);
const rankLoading = ref(false);

const problemViews = ref<ProblemRankView[]>();

const allOptions = [{ label: "全部语言", value: undefined }] as { label: string; value: JudgeLanguage | undefined }[];
const languageOptions = ref([] as { label: string; value: JudgeLanguage | undefined }[]);
languageOptions.value = GetSubmitLanguages();
languageOptions.value = allOptions.concat(languageOptions.value);

const rankTypeOptions = ref([] as { label: string; value: ProblemRankType }[]);
rankTypeOptions.value = GetProblemRankTypes();

const codeShow = ref(false);
const showJudgeJob = ref<JudgeJobView | null>(null);

const isCodeLoading = ref(false);

const userStore = useUserStore();

const searchForm = ref({
  language: undefined as JudgeLanguage | undefined,
  rankType: ProblemRankType.Time,
});

const listColumns = [
  {
    title: "排名",
    colKey: "index",
  },
  {
    title: "评测序号",
    colKey: "id",
    cell: (_: any, data: any) => {
      if (data.row.private && data.row.inserter != userStore.getUserId ){
        return (
          <t-button variant="text">
            {data.row.id}
          </t-button>
        );
      }
      return (
        <t-button variant="text" onClick={() => handleGotoJudgeJob(data.row.id)}>
          {data.row.id}
        </t-button>
      );
    },
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
    colKey: "code",
    cell: (_: any, data: any) => {
      let buttonText = GetJudgeLanguageStr(data.row.language);
      const languageValid = IsJudgeLanguageValid(data.row.language);
      if (languageValid && data.row.codeLength > 0) {
        buttonText = buttonText + " / " + data.row.codeLength;
      }
      let disabled = !languageValid || (data.row.private && data.row.inserter != userStore.getUserId );
      return (
        <t-button theme="default" onClick={() => handleShowCode(data.row)} disabled={disabled}>
          {buttonText}
        </t-button>
      );
    },
  },
  {
    title: "作者",
    colKey: "inserterUsername",
    cell: (_: any, data: any) => {
      const avatarUrl = GetAvatarUrl(data.row.inserterUsername, data.row.inserterEmail);
      return (
        <t-space>
          <t-avatar shape="round" size="32px" image={avatarUrl} hide-on-load-failed={false} />
          <t-button variant="dashed" onClick={() => handleGotoUsername(router, data.row.inserterUsername)}>
            {data.row.inserterNickname}
          </t-button>
        </t-space>
      );
    },
  },
  {
    title: "提交时间",
    colKey: "insertTime",
  },
];

const handleRenderRankHeader = () => {
  return (
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div>问题提交排名</div>
      <div>
        <t-button theme="default" variant="outline" disabled={staticsLoading.value} onClick={() => handleGotoProblem(problemKey.value)}>
          前往题目
        </t-button>
      </div>
    </div>
  );
};

const handleRenderStaticsHeader = () => {
  return (
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div>问题提交统计</div>
      <div>
        <t-button
          theme="default"
          variant="outline"
          disabled={staticsLoading.value}
          onClick={() => handleGotoJudgeList({ problem_key: problemKey.value })}
        >
          全部提交
        </t-button>
      </div>
    </div>
  );
};

const handleShowCode = async (jobView: JudgeJobView) => {
  isCodeLoading.value = true;
  codeShow.value = true;
  try {
    showJudgeJob.value = jobView;

    const res = await GetJudgeJobCode(Number(showJudgeJob.value.id));
    if (res.code === 0) {
      const response = res.data;
      const language = GetHighlightKeyByJudgeLanguage(response.language);

      showJudgeJob.value.code = `\`\`\`${language}\n${response.code}\n\`\`\``;
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } finally {
    isCodeLoading.value = false;
  }
};

const fetchStatics = async () => {
  staticsLoading.value = true;
  try {
    const res = await GetProblemStatistics(problemKey.value, searchForm.value.language);
    if (res.code === 0) {
      const chartDom = document.getElementById("problem-statics");
      const myChart = echarts.init(chartDom, null, {
        renderer: "canvas",
        useDirtyRect: false,
      });

      const dataList = [] as {
        name: string;
        value: number;
      }[];
      const colors = [] as string[];
      Object.values(JudgeStatus).forEach((status) => {
        if (typeof status === "number" && res.data && res.data[status]) {
          dataList.push({
            name: GetJudgeStatusStr(status),
            value: (res.data && res.data[status]) || 0,
          });
          colors.push(GetJudgeStatusColor(status));
        }
      });
      const option = {
        tooltip: {
          trigger: "item",
        },
        color: colors,
        series: [
          {
            type: "pie",
            radius: "50%",
            data: dataList,
            label: {
              show: true,
              formatter: "{b} ({d}%)", // 名称: 数值 (百分比)
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };

      myChart.setOption(option);
    } else {
      isError = true;
      ShowErrorTips(globalProperties, res.code);
      await handleGotoProblemList();
    }
  } catch (err) {
    isError = true;
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
    await handleGotoProblemList();
  } finally {
    staticsLoading.value = false;
  }
};

const fetchRankList = async () => {
  rankLoading.value = true;
  try {
    problemViews.value = [];
    const res = await GetProblemRank(problemKey.value, searchForm.value.language, searchForm.value.rankType);
    if (res.code === 0) {
      const responseList = res.data as ProblemRank[];
      if (!responseList || responseList.length <= 0) {
        ShowTextTipsInfo(globalProperties, "未找到记录");
        return;
      }
      problemViews.value = [];
      const offsetStart = 0;
      let index = 1;
      responseList.forEach((item) => {
        const result = ParseProblemRank(item);
        result.index = offsetStart + index++;
        problemViews.value?.push(result);
      });
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    rankLoading.value = false;
  }
};

const handleSearchFormSubmit = () => {
  fetchStatics();
  fetchRankList();
};

const handleSearchFormReset = () => {
  searchForm.value.language = undefined;
  searchForm.value.rankType = ProblemRankType.Time;
};

// 初始化分页信息
onMounted(async () => {
  rankLoading.value = true;

  watchHandle = watch(
    () => route.query,
    (_: any) => {
      if (Array.isArray(route.params.problemKey)) {
        problemKey.value = route.params.problemKey[0];
      } else {
        problemKey.value = route.params.problemKey;
      }
      if (!problemKey.value) {
        router.push({ name: "problem-list" });
        return;
      }
      isError = false;
      fetchStatics().finally(() => {
        if (!isError) {
          fetchRankList();
        }
      });
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
    <t-col :span="8">
      <t-card style="margin: 10px">
        <t-table
          :data="problemViews"
          :columns="listColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          :loading="rankLoading"
          table-layout="auto"
          style="min-height: 700px"
        />
      </t-card>
    </t-col>
    <t-col :span="4">
      <t-card class="sh-card">
        <t-form layout="inline" @submit="handleSearchFormSubmit" @reset="handleSearchFormReset">
          <t-form-item label="语言">
            <t-select v-model="searchForm.language" placeholder="请选择提交语言" auto-width clearable>
              <t-option v-for="item in languageOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item label="排名依据">
            <t-select v-model="searchForm.rankType" placeholder="请选择排名依据" auto-width clearable>
              <t-option v-for="item in rankTypeOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item>
            <t-space>
              <t-button theme="primary" type="submit">搜索</t-button>
              <t-button theme="default" variant="base" type="reset">重置</t-button>
            </t-space>
          </t-form-item>
        </t-form>
      </t-card>
      <t-card class="sh-card" :header="handleRenderRankHeader" :header-bordered="true">
        <p>排名取自本题所有通过的提交记录，可以从不同维度分析代码的优化空间。</p>
        <p>由于评测机存在统计误差，因此不建议靠相同算法的代码刷排名。</p>
      </t-card>

      <t-card class="sh-card" :header="handleRenderStaticsHeader" :header-bordered="true">
        <t-loading :loading="staticsLoading">
          <div id="problem-statics" style="min-height: 300px"></div>
        </t-loading>
      </t-card>
    </t-col>
  </t-row>

  <t-dialog v-model:visible="codeShow" width="800px" :cancel-btn="null" :close-btn="false" @confirm="codeShow = false">
    <template #header>
      <t-link
        @click="
          () => {
            handleGotoJudgeJob(showJudgeJob?.id, contestId);
          }
        "
      >
        {{ showJudgeJob?.id + " - " + GetJudgeLanguageStr(showJudgeJob?.language) }}
      </t-link>
    </template>
    <t-loading :loading="isCodeLoading">
      <md-preview :model-value="showJudgeJob?.code" :code-foldable="false" style="min-height: 100px"></md-preview>
    </t-loading>
  </t-dialog>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
