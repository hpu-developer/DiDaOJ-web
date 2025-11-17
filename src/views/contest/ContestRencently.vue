<script setup lang="tsx">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useCurrentInstance } from "@/util";
import { GetCommonErrorCode, GetEllipsisText, ShowErrorTips } from "@/util/tips";
import { GetContentRencently } from "@/apis/contest.ts";
import { ContestRemoteList } from "@/types/contest.ts";

const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;

const listColumns = ref([
  {
    title: "来源",
    colKey: "source",
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      const text = GetEllipsisText(data.row.title, 25);
      return (
        <t-tooltip content={data.row.title}>
          <t-button variant="text" onClick={() => window.open(data.row.link, "_blank")}>
            {text}
          </t-button>
        </t-tooltip>
      );
    },
  },
  {
    title: "类型",
    colKey: "type",
  },
  {
    title: "开始时间",
    colKey: "start_time",
    cell: (_: any, data: any) => {
      return new Date(data.row.start_time).toLocaleString();
    },
  },
  {
    title: "结束时间",
    colKey: "end_time",
    cell: (_: any, data: any) => {
      return new Date(data.row.end_time).toLocaleString();
    },
  },
  {
    title: "时长",
    colKey: "duration",
    cell: (_: any, data: any) => {
      const startTime = data.row.start_time;
      const endTime = data.row.end_time;
      const duration = Date.parse(endTime) - Date.parse(startTime);
      return `${Math.round((duration / (1000 * 60) / 60) * 10) / 10} 小时`;
    },
  },
  {
    title: "状态",
    colKey: "status",
    cell: (_: any, data: any) => {
      if (data.row.status === "进行中") {
        return (
          <t-tag theme="success" variant="light">
            {data.row.status}
          </t-tag>
        );
      } else if (data.row.status === "已结束") {
        return (
          <t-tag theme="danger" variant="light">
            {data.row.status}
          </t-tag>
        );
      } else {
        return (
          <t-tag theme="warning" variant="light">
            {data.row.status}
          </t-tag>
        );
      }
    },
  },
]);

const dataLoading = ref(false);

const contestViews = ref<ContestRemoteList[]>();

const fetchData = async () => {
  dataLoading.value = true;
  try {
    const res = await GetContentRencently();
    if (res.code === 0) {
      contestViews.value = res.data as ContestRemoteList[];
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (err) {
    console.error(err);
    ShowErrorTips(globalProperties, GetCommonErrorCode());
  } finally {
    dataLoading.value = false;
  }
};

onMounted(async () => {
  viewActive = true;
  await fetchData();
});

onBeforeUnmount(() => {
  viewActive = false;
});
</script>

<template>
  <t-row>
    <t-col :span="9">
      <t-card style="margin: 10px">
        <t-table
          :data="contestViews"
          :columns="listColumns"
          row-key="title"
          vertical-align="top"
          :hover="true"
          :loading="dataLoading"
          table-layout="auto"
          style="white-space: nowrap"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <t-card class="sh-card" header="近期比赛" :header-bordered="true">
        <p>来源于热门平台近期所举办的比赛，数据定期更新。</p>
      </t-card>
    </t-col>
  </t-row>
</template>

<style scoped>
.sh-card {
  margin: 10px;
}
</style>
