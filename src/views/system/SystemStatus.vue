<script setup lang="tsx">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { GetSystemStatus } from "@/apis/system.ts";
import { ShowErrorTips, useCurrentInstance } from "@/util";

const { globalProperties } = useCurrentInstance();

const weberList = ref([]);
const judgerList = ref([]);
const weberLoading = ref(false);
const lastJudgeJobCount = ref(0);
const judgeJobCount = ref(0);
const judgeSpeedStartTime = ref<Date | null>(null);
const judgeSpeedStartCount = ref(0);
const judgeSpeed = ref(0);
const lastJudgeSpeed = ref(0);
let speedTimer = -1;
let intervalId: number;

const handleRenderStatusHeader = (judger) => {
  let tagName = "失效";
  let tagTheme = "danger";

  const nowTime = new Date();
  const updateTime = new Date(judger.modifyTime);

  // 如果已经60秒未更新，认为离线
  if (nowTime.getTime() - modifyTime.getTime() > 30000) {
    tagName = "离线";
    tagTheme = "default";
  } else if (judger.cpuUsage > 90) {
    tagName = "CPU过高";
    tagTheme = "warning";
  } else if (judger.memPercent > 90) {
    tagName = "内存过高";
    tagTheme = "warning";
  } else {
    tagName = "在线";
    tagTheme = "success";
  }

  return (
    <t-space>
      <span>
        {judger.key} - {judger.name}
      </span>
      <span>{judger.modifyTime}</span>
      <t-tag theme={tagTheme} size="small">
        {tagName}
      </t-tag>
    </t-space>
  );
};

const handleReloadWeberStatus = async () => {
  const oldWebers = {};
  for (let i = 0; i < weberList.value.length; i++) {
    const web = weberList.value[i];
    oldWebers[web.key] = { ...web };
  }
  const oldJudgers = {};
  for (let i = 0; i < judgerList.value.length; i++) {
    const judger = judgerList.value[i];
    oldJudgers[judger.key] = { ...judger };
  }
  const webers = [];
  const judgers = [];

  const res = await GetSystemStatus();
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }
  const weber = res.data.web;
  const weberView = {
    key: "didaoj",
  };
  if (weber.name) {
    weberView.name = weber.name;
  } else {
    weberView.name = "-";
  }
  if (weber.modify_time) {
    weberView.modifyTime = new Date(weber.modify_time).toLocaleString();
  } else {
    weberView.modifyTime = "-";
  }
  if (weber.cpu_usage) {
    weberView.cpuUsage = Number(weber.cpu_usage);
  } else {
    weberView.cpuUsage = 0;
  }
  if (weber.mem_usage) {
    weberView.memUsage = weber.mem_usage / (1024.0 * 1024.0 * 1024.0);
  } else {
    weberView.memUsage = 0;
  }
  if (weber.mem_total) {
    weberView.memTotal = weber.mem_total / (1024.0 * 1024.0 * 1024.0);
  } else {
    weberView.memTotal = 0;
  }
  if (weberView.memTotal > 0) {
    weberView.memPercent = Math.round((weberView.memUsage / weberView.memTotal) * 10000) / 100;
  } else {
    weberView.memPercent = 0;
  }

  weberView.avgMessage = weber.avg_message;

  const oldWeber = oldWebers[weberView.key];
  if (oldWeber) {
    weberView.cpuUsageFrom = oldWeber.cpuUsage;
    weberView.memPercentFrom = oldWeber.memPercent;
    weberView.memUsageFrom = oldWeber.memUsage;
    weberView.memTotalFrom = oldWeber.memTotal;
  } else {
    weberView.cpuUsageFrom = 0;
    weberView.memPercentFrom = 0;
    weberView.memUsageFrom = 0;
    weberView.memTotalFrom = 0;
  }

  webers.push(weberView);

  weberList.value = webers;

  const responseJudgers = res.data.judger;

  for (let i = 0; i < responseJudgers.length; i++) {
    const judger = responseJudgers[i];
    const judgerView = {
      key: judger.key,
      name: judger.name,
    };
    if (judger.name) {
      judgerView.name = judger.name;
    } else {
      judgerView.name = "-";
    }
    if (judger.modify_time) {
      judgerView.modifyTime = new Date(judger.modify_time).toLocaleString();
    } else {
      judgerView.modifyTime = "-";
    }
    if (judger.max_job) {
      judgerView.maxJob = Number(judger.max_job);
    } else {
      judgerView.maxJob = 0;
    }
    if (judger.cpu_usage) {
      judgerView.cpuUsage = Number(judger.cpu_usage);
    } else {
      judgerView.cpuUsage = 0;
    }
    if (judger.mem_usage) {
      judgerView.memUsage = judger.mem_usage / (1024.0 * 1024.0 * 1024.0);
    } else {
      judgerView.memUsage = 0;
    }
    if (judger.mem_total) {
      judgerView.memTotal = judger.mem_total / (1024.0 * 1024.0 * 1024.0);
    } else {
      judgerView.memTotal = 0;
    }
    if (judgerView.memTotal > 0) {
      judgerView.memPercent = Math.round((judgerView.memUsage / judgerView.memTotal) * 10000) / 100;
    } else {
      judgerView.memPercent = 0;
    }

    judgerView.avgMessage = judger.avg_message;

    if (oldJudgers[judger.key]) {
      judgerView.maxJobFrom = oldJudgers[judger.key].maxJob;
      judgerView.cpuUsageFrom = oldJudgers[judger.key].cpuUsage;
      judgerView.memPercentFrom = oldJudgers[judger.key].memPercent;
      judgerView.memUsageFrom = oldJudgers[judger.key].memUsage;
      judgerView.memTotalFrom = oldJudgers[judger.key].memTotal;
    } else {
      judgerView.maxJobFrom = 0;
      judgerView.cpuUsageFrom = 0;
      judgerView.memPercentFrom = 0;
      judgerView.memUsageFrom = 0;
      judgerView.memTotalFrom = 0;
    }

    judgers.push(judgerView);
  }

  judgerList.value = judgers;

  lastJudgeJobCount.value = judgeJobCount.value;
  judgeJobCount.value = res.data.judge_job;

  lastJudgeSpeed.value = judgeSpeed.value;
  if (judgeJobCount.value > 0) {
    if (!judgeSpeedStartTime.value) {
      judgeSpeedStartTime.value = new Date();
      judgeSpeedStartCount.value = judgeJobCount.value;
      judgeSpeed.value = 0;
      lastJudgeSpeed.value = 0;
    } else {
      judgeSpeed.value =
        ((judgeJobCount.value - judgeSpeedStartCount.value) / ((new Date().getTime() - judgeSpeedStartTime.value.getTime()) / 1000)) * 60;
    }

    clearTimeout(speedTimer);
    speedTimer = -1;
  } else {
    // 十秒后清理
    if (speedTimer < 0) {
      speedTimer = setTimeout(() => {
        judgeSpeedStartTime.value = null;
        judgeSpeedStartCount.value = 0;
      }, 10000);
    }
  }
};

const handleReloadStatus = async () => {
  await handleReloadWeberStatus();
  weberLoading.value = false;
};

onMounted(async () => {
  judgerList.value = [];
  weberList.value = [];
  weberLoading.value = true;
  await handleReloadStatus();
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    handleReloadStatus();
  }, 5000);
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <t-loading :loading="weberLoading">
    <t-card title="接口状态" class="judger-status">
      <div class="judger-status-panel">
        <t-card v-for="weber in weberList" :key="weber.key" :header="() => handleRenderStatusHeader(weber)" class="judge-status-judger">
          <t-space class="judge-status-judger">
            <t-statistic
              title="CPU使用率"
              :value="weber.cpuUsage"
              :animation="{
                valueFrom: weber.cpuUsageFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="%"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存使用率"
              :value="weber.memPercent"
              :animation="{
                valueFrom: weber.memPercentFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="%"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存使用量"
              :animation="{
                valueFrom: weber.memUsageFrom,
                duration: 2000,
              }"
              :animation-start="true"
              :value="weber.memUsage"
              unit="GB"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存总量"
              :value="weber.memTotal"
              :animation="{
                valueFrom: weber.memTotalFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="GB"
              :decimalPlaces="2"
            ></t-statistic>
          </t-space>
          <template #footer>
            <span> 负载信息：{{ weber.avgMessage }} </span>
          </template>
        </t-card>
      </div>
    </t-card>
    <t-card title="判题机状态" class="judger-status">
      <div style="text-align: center; margin-bottom: 20px">
        <t-space>
          <t-statistic
            title="未完成的评测数量"
            :value="judgeJobCount"
            :animation="{
              valueFrom: lastJudgeJobCount,
              duration: 4000,
            }"
            :animation-start="true"
          ></t-statistic>
          <t-statistic
            v-if="judgeSpeedStartTime"
            title="评测数量趋势"
            :value="judgeSpeed"
            :animation="{
              valueFrom: lastJudgeSpeed,
              duration: 4000,
            }"
            :animation-start="true"
            :decimalPlaces="2"
            unit="/分钟"
          ></t-statistic>
          <t-statistic
            v-else
            title="评测数量趋势"
            :format="
              () => {
                return '样本较少';
              }
            "
          ></t-statistic>
        </t-space>
      </div>
      <div class="judger-status-panel">
        <t-card v-for="judger in judgerList" :key="judger.key" :header="() => handleRenderStatusHeader(judger)" class="judge-status-judger">
          <t-space class="judge-status-judger">
            <t-statistic
              title="并发"
              :value="judger.maxJob"
              :animation="{
                valueFrom: judger.maxJob,
                duration: 2000,
              }"
              :animation-start="true"
            ></t-statistic>
            <t-statistic
              title="CPU使用率"
              :value="judger.cpuUsage"
              :animation="{
                valueFrom: judger.cpuUsageFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="%"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存使用率"
              :value="judger.memPercent"
              :animation="{
                valueFrom: judger.memPercentFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="%"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存使用量"
              :animation="{
                valueFrom: judger.memUsageFrom,
                duration: 2000,
              }"
              :animation-start="true"
              :value="judger.memUsage"
              unit="GB"
              :decimalPlaces="2"
            ></t-statistic>
            <t-statistic
              title="内存总量"
              :value="judger.memTotal"
              :animation="{
                valueFrom: judger.memTotalFrom,
                duration: 2000,
              }"
              :animation-start="true"
              unit="GB"
              :decimalPlaces="2"
            ></t-statistic>
          </t-space>
          <template #footer>
            <span> 负载信息：{{ judger.avgMessage }} </span>
          </template>
        </t-card>
      </div>
    </t-card>
  </t-loading>
</template>

<style scoped>
.judger-status {
  margin: 10px;
  padding: 20px;
}

.judger-status-panel {
  display: flex;
  flex-wrap: wrap; /* 自动换行 */
  justify-content: center; /* 不换行时居中 */
  gap: 16px; /* 元素间距 */
}

.judge-status-judger {
}
</style>
