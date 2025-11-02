<script setup lang="tsx">
import { nextTick, WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetContestProblemIndexStr, GetContestStatistics } from "@/apis/contest.ts";

import { GetJudgeStatusColor, GetJudgeStatusStr, IsJudgeStatusRunning, JudgeStatus } from "@/apis/judge.ts";

import * as echarts from "echarts/core";
import { TitleComponent, ToolboxComponent, TooltipComponent, GridComponent, LegendComponent } from "echarts/components";
import { PieChart, LineChart } from "echarts/charts";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { handleGotoContestProblem } from "@/util/router.ts";
import { ProblemRankType } from "@/apis/problem.ts";
import { GetJudgeLanguageStr, GetSubmitLanguages, JudgeLanguage } from "@/apis/language.ts";

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  CanvasRenderer,
  UniversalTransition,
  LabelLayout,
]);

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

let contestId = 0;
const contestLoading = ref(false);
const contestData = ref([]);

const allOptions = [{ label: "全部语言", value: undefined }] as { label: string; value: JudgeLanguage | undefined }[];
const languageOptions = ref([] as { label: string; value: JudgeLanguage | undefined }[]);
languageOptions.value = GetSubmitLanguages();
languageOptions.value = allOptions.concat(languageOptions.value);

const searchForm = ref({
  language: undefined as JudgeLanguage | undefined,
});

const listColumns = ref([] as any[]);

const loadCountStatistics = (countData: { [key: string]: number }) => {
  let dateValues = [];
  let acceptValues = [];
  let attemptValues = [];
  let lastAcceptValue = 0;
  let lastAttemptValue = 0;
  for (const item of countData) {
    const date = new Date(item.date);
    const dataDayString = date.toLocaleString();
    dateValues.push(dataDayString);
    acceptValues.push(item.accept + lastAcceptValue);
    attemptValues.push(item.attempt + lastAttemptValue);
    lastAcceptValue += item.accept;
    lastAttemptValue += item.attempt;
  }

  const chartDom = document.getElementById("count-statistics-div");
  const myChart = echarts.init(chartDom);
  const option = {
    title: {
      text: "提交数量",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    legend: {
      data: ["Accept", "Attempt"],
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: dateValues,
      },
    ],
    yAxis: [
      {
        type: "value",
      },
    ],
    series: [
      {
        name: "Accept",
        type: "line",
        stack: "Total",
        color: "#2ecc71",
        areaStyle: {},
        emphasis: {
          focus: "series",
        },
        data: acceptValues,
      },
      {
        name: "Attempt",
        type: "line",
        stack: "Total",
        color: "#409EFF",
        label: {
          show: true,
          position: "top",
        },
        areaStyle: {},
        emphasis: {
          focus: "series",
        },
        data: attemptValues,
      },
    ],
  };

  myChart.setOption(option);

  const resizeObserver = new ResizeObserver(() => {
    myChart.resize();
  });
  resizeObserver.observe(chartDom!);
};

const loadLanguageStatistics = (languageData: { [key: string]: number }) => {
  const chartDom = document.getElementById("language-statistics-div");
  const myChart = echarts.init(chartDom);

  let dataList = [] as { name: string; value: number }[];
  Object.keys(languageData).forEach((key) => {
    dataList.push({
      name: GetJudgeLanguageStr(Number(key)),
      value: languageData[key],
    });
  });

  const option = {
    title: {
      text: "语言使用统计",
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "语言",
        type: "pie",
        radius: "50%",
        data: dataList,
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
};

const fetchContestData = async () => {
  contestLoading.value = true;

  const res = await GetContestStatistics(contestId, searchForm.value.language);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
    return;
  }
  if (!res.data.has_auth) {
    ShowTextTipsInfo(globalProperties, "您目前没有权限查看比赛统计");
    await router.push({ name: "contest-detail", params: { contestId: contestId } });
    return;
  }
  const statisticsList = res.data.statistics;

  statisticsList.sort((a, b) => {
    return a.index - b.index;
  });

  contestData.value = [];
  statisticsList.forEach((item) => {
    const statistics = item.statistics as { [key: number]: number };
    const elment = {
      index: item.index,
      key: GetContestProblemIndexStr(item.index),
    } as Record<string, any>;
    Object.values(JudgeStatus).forEach((status) => {
      if (typeof status === "number" && statistics && statistics[status]) {
        elment[status] = statistics[status];
      } else if (typeof status === "number") {
        elment[status] = "-";
      }
    });
    contestData.value.push(elment);
  });

  loadCountStatistics(res.data.count);
  loadLanguageStatistics(res.data.language);

  nextTick(function () {
    const allDoms = document.getElementsByClassName("echart-statistics");
    for (let i = 0; i < allDoms.length; i++) {
      var chartDom = allDoms[i] as HTMLElement;
      var myChart = echarts.init(chartDom);

      const statistics = statisticsList[i].statistics;

      const colors = [] as string[];
      let dataList = [] as { name: string; value: number }[];
      Object.values(JudgeStatus).forEach((status) => {
        if (typeof status === "number" && statistics && statistics[status]) {
          colors.push(GetJudgeStatusColor(status));
          dataList.push({
            name: GetJudgeStatusStr(status),
            value: (statistics && statistics[status]) || 0,
          });
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
    }
  });

  contestLoading.value = false;
};

const handleSearchFormSubmit = () => {
  fetchContestData();
};

const handleSearchFormReset = () => {
  searchForm.value.language = undefined;
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

  listColumns.value = [
    {
      title: "序号",
      colKey: "index",
      cell: (_: any, data: any) => {
        return (
          <t-button variant="dashed" onClick={async () => await handleGotoContestProblem(contestId, data.row.index)}>
            {data.row.key}
          </t-button>
        );
      },
    },
  ];
  listColumns.value.push({
    title: "统计",
    colKey: "statistics",
    cell: (_: any, data: any) => {
      return <div class="echart-statistics" style="width: 300px;height: 200px;"></div>;
    },
  });

  const excludeStatuses = [JudgeStatus.Unknown, JudgeStatus.Max];
  Object.values(JudgeStatus).forEach((status) => {
    if (excludeStatuses.includes(status as JudgeStatus)) {
      return;
    }
    if (typeof status !== "number") {
      return;
    }
    if (IsJudgeStatusRunning(status)) {
      return;
    }
    listColumns.value.push({
      title: GetJudgeStatusStr(status),
      colKey: status,
    });
  });

  await fetchContestData();
});

onBeforeUnmount(() => {
  viewActive = false;

  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-row>
    <t-col :span="8">
      <t-card class="sh-card"><div id="count-statistics-div" style="min-height: 400px"></div></t-card>
    </t-col>
    <t-col :span="4">
      <t-card class="sh-card">
        <t-form layout="inline" @submit="handleSearchFormSubmit" @reset="handleSearchFormReset">
          <t-form-item label="语言">
            <t-select v-model="searchForm.language" placeholder="请选择提交语言" auto-width clearable>
              <t-option v-for="item in languageOptions" :key="item.value" :value="item.value" :label="item.label"></t-option>
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
      <t-card class="sh-card"><div id="language-statistics-div" style="min-height: 325px"></div></t-card>
    </t-col>
  </t-row>

      <t-card style="margin: 10px">
        <t-table
          :data="contestData"
          :columns="listColumns"
          row-key="id"
          vertical-align="middle"
          :hover="true"
          :loading="contestLoading"
          table-layout="auto"
          style="white-space: nowrap"
        />
      </t-card>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
