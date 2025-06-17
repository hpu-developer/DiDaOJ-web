<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Hitokoto from "@/components/Hitokoto.vue";
import { GetWebAnnouncement, GetWebNotification } from "@/apis/system.ts";
import type { Notification, Announcement } from "@/types/system.ts";
import { ShowTextTipsError, useCurrentInstance } from "@/util";
import Vditor from "vditor";
import VChart from "@visactor/vchart";
import { GetJudgeStaticsRecently } from "@/apis/judge.ts";
import { GetProblemDailyRecently, ProblemAttemptStatus } from "@/apis/problem.ts";

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

const handleReloadStatus = async () => {
  notification.value = await GetWebNotification();
};

const loadWebAnnouncement = async () => {
  try {
    const announcementRes = await GetWebAnnouncement();

    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    announcement.value.title = announcementRes.title;
    announcement.value.content = await Vditor.md2html(announcementRes.content, options);
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

  let values = [];
  for (const item of res.data) {
    const date = new Date(item.date);
    const dataDayString = `${date.getMonth() + 1}-${date.getDate()}`;
    values.push({
      Date: dataDayString,
      Type: "Unaccept",
      Count: item.attempt - item.accept,
    });
    values.push({
      Date: dataDayString,
      Type: "Accept",
      Count: item.accept,
    });
  }

  const spec = {
    type: "bar",
    data: [
      {
        id: "barData",
        values: values,
      },
    ],
    xField: "Date",
    yField: "Count",
    seriesField: "Type",
    stack: true,
    legends: {
      visible: true,
    },
    bar: {
      // The state style of bar
      state: {
        hover: {
          stroke: "#000",
          lineWidth: 1,
        },
      },
    },
    height: 300,
  };

  const vchart = new VChart(spec, { dom: "ojStaticsDiv" });
  vchart.renderSync();
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
        id: item.id,
        title: title,
        problemId: item.problem_id,
        theme: theme,
        tag: tag,
      } as any);
    });
  }
};

onMounted(async () => {
  stateLoading.value = true;
  await handleReloadStatus();
  intervalId = setInterval(() => {
    handleReloadStatus();
  }, 30000);
  await loadWebAnnouncement();

  await loadOjStatics();

  await loadProblemDaily();

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
          <t-alert v-if="notification" class="dida-notification-div" :theme="notification.theme">
            {{ notification.content }}
          </t-alert>

          <div class="dida-swiper-div">
            <t-swiper class="dida-swiper">
              <t-swiper-item>
                <img src="https://cdn.codeoj.cn/image/banner.jpg" class="swiper-img" />
              </t-swiper-item>
              <t-swiper-item>
                <img src="https://cdn.codeoj.cn/image/banner.jpg" class="swiper-img" />
              </t-swiper-item>
            </t-swiper>
          </div>

          <div id="ojStaticsDiv"></div>

          <t-card :title="announcement?.title" style="width: calc(100% - 100px); margin: 0 auto">
            <div v-html="announcement?.content"></div>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <t-card style="margin: 10px" :bordered="true">
          <img src="https://api.jysafe.cn/ip/" alt="Welcome" style="width: 100%" />
        </t-card>
        <Hitokoto style="margin: 10px" />

        <t-card style="margin: 10px" :bordered="true" title="每日一题">
          <t-list :split="true" size="small">
            <t-list-item v-for="item in problemDailies" :key="item.id">
              <div>
                <t-link @click="$router.push({ name: 'problem-detail', params: { problemId: item.problemId } })">
                  {{ item.problemId }}
                </t-link>
              </div>
              <div>
                <t-link @click="$router.push({ name: 'problem-detail', params: { problemId: item.problemId } })">
                  {{ item.title }}
                </t-link>
              </div>
              <t-list-item-meta :description="item.id" />
              <t-tag :theme="item.theme">{{ item.tag }}</t-tag>
            </t-list-item>
          </t-list>
        </t-card>

        <t-card style="margin: 10px" :bordered="true">
          <template #header>
            <b>友情链接</b>
          </template>
          <t-list>
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
