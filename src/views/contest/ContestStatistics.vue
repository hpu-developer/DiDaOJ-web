<script setup lang="tsx">
import { nextTick, WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ShowErrorTips, useCurrentInstance } from "@/util";
import { GetContestProblemIndexStr, GetContestStatistics } from "@/apis/contest.ts";

import { GetJudgeStatusColor, GetJudgeStatusStr, IsJudgeStatusRunning, JudgeStatus } from "@/apis/judge.ts";

import * as echarts from "echarts/core";
import { TitleComponent, ToolboxComponent, TooltipComponent, GridComponent, LegendComponent } from "echarts/components";
import { PieChart, LineChart } from "echarts/charts";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { handleGotoContestProblem } from "@/util/router.ts";

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

const listColumns = ref([] as any[]);

const fetchContestData = async () => {
  contestLoading.value = true;

  const res = await GetContestStatistics(contestId, undefined);
  if (res.code !== 0) {
    contestLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "contest" });
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


  var chartDom = document.getElementById('main');
  var myChart = echarts.init(chartDom);
  var option;

  option = {
    title: {
      text: 'Stacked Area Chart'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: 'Email',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: [120, 132, 101, 134, 90, 230, 210]
      },
      {
        name: 'Union Ads',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: [220, 182, 191, 234, 290, 330, 310]
      },
      {
        name: 'Video Ads',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: [150, 232, 201, 154, 190, 330, 410]
      },
      {
        name: 'Direct',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: [320, 332, 301, 334, 390, 330, 320]
      },
      {
        name: 'Search Engine',
        type: 'line',
        stack: 'Total',
        label: {
          show: true,
          position: 'top'
        },
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: [820, 932, 901, 934, 1290, 1330, 1320]
      }
    ]
  };

  option && myChart.setOption(option);


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

  listColumns.value.push({
    title: "统计",
    colKey: "statistics",
    cell: (_: any, data: any) => {
      return <div class="echart-statistics" style="width: 300px;height: 200px;"></div>;
    },
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
    </t-col>
    <t-col :span="4">
      <div style="margin: 10px">
        <t-card class="sh-card"><div id="main" style="min-height: 400px"></div></t-card>
      </div>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
