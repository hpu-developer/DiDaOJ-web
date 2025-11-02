<script setup lang="tsx">
import { ref, onMounted, onUnmounted } from "vue";
import Hitokoto from "@/components/Hitokoto.vue";
import { GetWebAnnouncement, GetWebNotification } from "@/apis/system.ts";
import type { Notification, Announcement } from "@/types/system.ts";
import { ShowTextTipsError, useCurrentInstance } from "@/util";
import { GetJudgeStaticsRecently } from "@/apis/judge.ts";
import { GetProblemDailyRecently, ProblemAttemptStatus } from "@/apis/problem.ts";
import * as echarts from "echarts/core";

const { globalProperties } = useCurrentInstance();

let intervalId = -1;
const notification = ref<Notification>({
  theme: "info",
  content: "",
});
const announcement = ref<Announcement>({
  title: "",
  content: "",
});
const problemDailies = ref([] as any[]);
const stateLoading = ref(false);
const ojStaticsLoading = ref(false);
const problemDailyLoading = ref(false);
const ojNotifyLoading = ref(false);
const ojAnnouncementLoading = ref(false);

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

const loadWebAnnouncement = async () => {
  try {
    const announcementRes = await GetWebAnnouncement();
    announcement.value.title = announcementRes.title;
    announcement.value.content = announcementRes.content;
  } catch (e) {
    ShowTextTipsError(globalProperties, "加载公告失败");
    announcement.value = {
      title: "公告加载失败",
      content: "请刷新页面重新获取",
    };
  }
};

const loadOjStatics = async () => {
  const res = await GetJudgeStaticsRecently();
  if (res.code !== 0) {
    ShowTextTipsError(globalProperties, "加载OJ统计数据失败");
    return;
  }

  var dom = document.getElementById("ojStaticsDiv");
  var myChart = echarts.init(dom, null, {
    renderer: "canvas",
    useDirtyRect: false
  });
  let dateValues = [];
  let acceptValues = [];
  let attemptValues = [];
  for (const item of res.data) {
    const date = new Date(item.date);
    const dataDayString = `${date.getMonth() + 1}-${date.getDate()}`;
    dateValues.push(dataDayString);
    acceptValues.push(item.accept);
    attemptValues.push(item.attempt);
  }
  let option = {
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

  if (option && typeof option === "object") {
    myChart.setOption(option);
  }
  const resizeObserver = new ResizeObserver(() => {
    myChart.resize();
  });
  resizeObserver.observe(dom!);
};

const loadProblemDaily = async () => {
  problemDailies.value = [];
  const res = await GetProblemDailyRecently();
  if (res.code !== 0) {
    ShowTextTipsError(globalProperties, "加载每日问题数据失败");
    return;
  }
  if (res.data.list && res.data.list.length > 0) {
    res.data.list.forEach((item: any) => {
      let theme = "default";
      let tag = "未尝试";
      if (res.data.attempt_status) {
        const status = res.data.attempt_status[item.problem_id];
        if (status) {
          switch (status) {
            case ProblemAttemptStatus.Accept:
              theme = "success";
              tag = "已解决";
              break;
            case ProblemAttemptStatus.Attempt:
              theme = "warning";
              tag = "待解决";
              break;
            default:
              theme = "default";
              tag = "未尝试";
          }
        }
      }

      const title = `${item.title}`;

      problemDailies.value.push({
        key: item.key,
        title: title,
        problemKey: item.problem_key,
        theme: theme,
        tag: tag,
      } as any);
    });
  }
};

onMounted(async () => {
  stateLoading.value = true;
  ojStaticsLoading.value = true;
  problemDailyLoading.value = true;
  ojNotifyLoading.value = true;
  ojAnnouncementLoading.value  = true;

  void (async () => {
    await handleReloadStatus();
    ojNotifyLoading.value = false;
    intervalId = setInterval(() => {
      handleReloadStatus();
    }, 30000);
    await loadWebAnnouncement();
    ojAnnouncementLoading.value = false;
  })();

  void (async () => {
    await loadOjStatics();
    ojStaticsLoading.value = false;
  })();

  void (async () => {
    await loadProblemDaily();
    problemDailyLoading.value = false;
  })();

  stateLoading.value = false;
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <t-loading :loading="stateLoading">
    <t-row>
      <t-col :span="8">
        <div class="sh-main">
          <t-loading :loading="ojNotifyLoading && !stateLoading">
            <t-alert v-if="notification" class="dida-notification-div" :theme="notification.theme">
              {{ notification.content }}
            </t-alert>
          </t-loading>

          <div class="dida-swiper-div">
            <t-swiper class="dida-swiper">
              <t-swiper-item>
                <img src="https://r2-oj.didapipa.com/image/banner.jpg" class="swiper-img" />
              </t-swiper-item>
              <t-swiper-item>
                <img src="https://r2-oj.didapipa.com/image/banner.jpg" class="swiper-img" />
              </t-swiper-item>
            </t-swiper>
          </div>

          <t-loading :loading="ojStaticsLoading && !stateLoading" style="width: 100%">
            <div id="ojStaticsDiv" style="min-height: 300px"></div>
          </t-loading>

          <t-loading :loading="ojAnnouncementLoading && !stateLoading">
            <t-card :title="announcement?.title" style="width: calc(100% - 100px); margin: 0 auto; min-height: 300px">
              <md-preview :model-value="announcement?.content" previewTheme="cyanosis" />
            </t-card>
          </t-loading>
        </div>
      </t-col>
      <t-col :span="4">
        <t-card style="margin: 10px" :bordered="true">
          <img src="https://api.jysafe.cn/ip/" alt="Welcome" style="width: 100%" />
        </t-card>
        <Hitokoto style="margin: 10px" />

        <t-card style="margin: 10px" :bordered="true" title="每日一题">
          <template #actions>
            <t-link @click="$router.push({ name: 'problem-daily-list' })">查看全部</t-link>
          </template>
          <t-loading :loading="problemDailyLoading && !stateLoading">
            <t-list :split="true" size="small" style="min-height: 200px">
              <t-list-item v-for="item in problemDailies" :key="item.key">
                <t-list-item-meta style="width: 100px">
                  <template #description>
                    <t-link @click="$router.push({ name: 'problem-daily-detail', params: { dailyId: item.key } })">
                      {{ item.problemKey }}
                    </t-link>
                  </template>
                </t-list-item-meta>
                <t-list-item-meta style="width: 200px">
                  <template #description>
                    <t-link @click="$router.push({ name: 'problem-daily-detail', params: { dailyId: item.key } })">
                      {{ item.title }}
                    </t-link>
                  </template>
                </t-list-item-meta>
                <t-list-item-meta style="width: 135px" :description="item.key" />
                <t-list-item-meta>
                  <template #description>
                    <t-tag :theme="item.theme">{{ item.tag }}</t-tag>
                  </template>
                </t-list-item-meta>
              </t-list-item>
            </t-list>
          </t-loading>
        </t-card>

        <t-card style="margin: 10px" :bordered="true">
          <template #header>
            <b>友情链接</b>
          </template>
          <t-list>
            <t-list-item>
              <t-link href="https://www.hello-algo.com/" target="_blank">Hello 算法</t-link>
            </t-list-item>
            <t-list-item>
              <t-link href="https://oi-wiki.org/" target="_blank">OI Wiki</t-link>
            </t-list-item>
            <t-list-item>
              <t-link href="https://boiltask.com" target="_blank">BoilTask Blog</t-link>
            </t-list-item>
          </t-list>
        </t-card>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.sh-main {
  margin: 10px;
}

.dida-notification-div {
  width: calc(100% - 100px);
  margin: 20px auto;
}

.dida-swiper-div {
  width: calc(100% - 100px);
  margin: 20px auto;
}

.swiper-img {
  width: 100%;
}
</style>
