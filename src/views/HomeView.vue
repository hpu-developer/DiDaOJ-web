<script setup lang="tsx">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.ts";
import Hitokoto from "@/components/Hitokoto.vue";
import { GetWebAnnouncement, GetWebNotification } from "@/apis/system.ts";
import { PostCheckin, GetCheckinToday } from "@/apis/user.ts";
import type { Notification, Announcement } from "@/types/system.ts";
import { ShowTextTipsError, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { GetJudgeStaticsRecently } from "@/apis/judge.ts";
import { GetProblemDailyRecently, ProblemAttemptStatus } from "@/apis/problem.ts";
import * as echarts from "echarts/core";

const router = useRouter();
const userStore = useUserStore();
const checkinCount = ref(0);
const isCheckedIn = ref(false);
const checkinLoading = ref(false);

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

// 处理签到
const handleCheckin = async () => {
  if (!userStore.isLogin()) {
    router.push({ name: 'user-login' });
    return;
  }
  
  try {
    const res = await PostCheckin();
    if (res.code === 0) {
      ShowTextTipsSuccess(globalProperties, "签到成功！");
      isCheckedIn.value = true;
      // 更新签到人数
      checkinCount.value++;
    } else {
      ShowTextTipsError(globalProperties, `签到失败：${res.code}`);
    }
  } catch (e) {
    ShowTextTipsError(globalProperties, "签到请求失败，请稍后重试");
  }
};

// 加载签到数据
const loadCheckinData = async () => {
  checkinLoading.value = true;
  try {
    const res = await GetCheckinToday();
    if (res.code === 0) {
      // 服务器返回 {count:1,check_in:false} 结构
      checkinCount.value = res.data?.count || 0;
      isCheckedIn.value = res.data?.check_in || false;
    } else {
      ShowTextTipsError(globalProperties, `获取签到人数失败：${res.code}`);
      // 设置默认值
      checkinCount.value = 0;
      isCheckedIn.value = false;
    }
  } catch (e) {
    console.error("获取签到数据失败：", e);
    // 设置默认值
    checkinCount.value = 0;
    isCheckedIn.value = false;
  } finally {
    checkinLoading.value = false;
  }
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
    useDirtyRect: false,
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
  ojAnnouncementLoading.value = true;

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

  void (async () => {
    await loadCheckinData();
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
        <t-card style="margin: 10px" :bordered="true" title="每日签到">
          <t-loading :loading="checkinLoading && !stateLoading">
            <div style="display: flex; flex-direction: column; align-items: center; padding: 20px 0;">
              <div style="margin-bottom: 20px; font-size: 18px; color: #409EFF;">
                今日已有 <span style="font-weight: bold; color: #F56C6C;">{{ checkinCount }}</span> 人签到
              </div>
              <t-button 
                type="primary" 
                @click="handleCheckin"
                :disabled="isCheckedIn"
                style="width: 120px;"
              >
                {{ isCheckedIn ? '已签到' : '立即签到' }}
              </t-button>
              <div v-if="isCheckedIn" style="margin-top: 10px; color: #67C23A; font-size: 14px;">
                签到成功，开始解题吧！
              </div>
            </div>
          </t-loading>
        </t-card>

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

        <t-card style="margin: 10px" :bordered="true" title="判官状态">
          <template #actions>
            <t-link @click="$router.push({ name: 'system-about' })">系统说明</t-link>
          </template>
          <div class="oj-grid">
            <div class="oj-item">
              <t-link href="https://oj.didapipa.com/" target="_blank">DidaOJ</t-link>
              <t-tag theme="success" shape="round">有效</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://acm.hdu.edu.cn/" target="_blank">HDU</t-link>
              <t-tag theme="success" shape="round">有效</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="http://poj.org/" target="_blank">POJ</t-link>
              <t-tag theme="success" shape="round">有效</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://codeforces.com/" target="_blank">CodeForces</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://lightoJ.com/" target="_blank">LightOJ</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://onlinejudge.org/" target="_blank">UVaOJ</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://acm.haut.edu.cn/" target="_blank">HAUTOJ</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://oj.zznu.edu.cn/" target="_blank">ZZNUOJ</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://xcpc.nyist.edu.cn/" target="_blank">NYOJ-XCPC</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://acm.nyist.edu.cn/" target="_blank">NYOJ-ACM</t-link>
              <t-tag theme="warning" shape="round">开发中</t-tag>
            </div>
            <div class="oj-item">
              <t-link href="https://acm.zzuli.edu.cn/" target="_blank">ZZULIOJ</t-link>
              <t-tag theme="default" shape="round">失效</t-tag>
            </div>
          </div>
        </t-card>
        <t-card class="friend-link-card" :bordered="true" title="友情链接">
          <ul>
            <li><t-link href="https://www.hello-algo.com/" target="_blank">Hello 算法</t-link></li>
            <li><t-link href="https://oi-wiki.org/" target="_blank">OI Wiki</t-link></li>
            <li><t-link href="https://boiltask.com" target="_blank">BoilTask Blog</t-link></li>
          </ul>
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

.oj-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 三列布局 */
  gap: 16px; /* 横纵间距 */
  margin: 10px 0;
}

.oj-item {
  display: flex;
  justify-content: space-between; /* 左右对齐 */
  align-items: center; /* 垂直居中 */
  padding: 8px;
  border: 1px solid #e0e0e0; /* 可选：表格风格边框 */
  border-radius: 6px;
}

.friend-link-card {
  margin: 10px;
}
.friend-link-card li {
  margin: 8px;
}
</style>
