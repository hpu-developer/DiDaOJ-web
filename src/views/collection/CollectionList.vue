<script setup lang="tsx">
import type { WatchStopHandle } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { GetCollectionList, ParseCollection, PostCreateCollection } from "@/apis/collection.ts";
import { Collection, CollectionCreateRequest, CollectionView } from "@/types/collection.ts";

const route = useRoute();
const router = useRouter();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;
const modalShow = ref(false);
const confirmLoading = ref(false);

const listColumns = ref([
  {
    title: "ID",
    colKey: "id",
    width: "100",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoCollection(data.row.id)}>
          {data.row.id}
        </t-button>
      );
    },
  },
  {
    title: "标题",
    colKey: "title",
    cell: (_: any, data: any) => {
      return (
        <t-button variant="text" onClick={() => handleGotoCollection(data.row.id)}>
          {data.row.title}
        </t-button>
      );
    },
  },
  {
    title: "负责人",
    colKey: "ownerNickname",
    width: "200",
  },
  {
    title: "开始时间",
    colKey: "startTime",
    width: "180",
  },
  {
    title: "结束时间",
    colKey: "endTime",
    width: "180",
  },
]);

const dataLoading = ref(false);

let currentPage = 1;
let currentPageSize = 50;

const pagination = ref({
  current: currentPage,
  pageSize: currentPageSize,
  defaultCurrent: currentPage,
  defaultPageSize: currentPageSize,
  total: 0,
  pageSizeOptions: [50, 100],
});

const collectionViews = ref<CollectionView[]>();

const collectionSearchForm = ref({
  title: "",
  username: "",
});

const collectionCreateForm = ref<CollectionCreateRequest>({
  title: "",
  description: "",
  open_time: [],
});

const handleGotoCollection = (id: string) => {
  if (!id) {
    return;
  }
  router.push({ path: "/collection/" + id });
};

const handleSearchCollection = async () => {
  await router.push({
    query: {
      ...route.query,
      title: collectionSearchForm.value.title,
      username: collectionSearchForm.value.username,
      page: 1,
      page_size: pagination.value.defaultPageSize,
    },
  });
};

const fetchData = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetCollectionList(current, pageSize);
    collectionViews.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as Collection[];
      for (let i = 0; i < responseList.length; i++) {
        const item = responseList[i];
        const result = await ParseCollection(item);
        collectionViews.value?.push(result);
      }
      pagination.value = { ...pagination.value, total: res.data.total_count };
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

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};

const handleCreateCollection = () => {
  modalShow.value = true;
};

const handleConfirmCreate = async () => {
  confirmLoading.value = true;

  console.log("collectionCreateForm", collectionCreateForm.value);

  PostCreateCollection(collectionCreateForm.value)
    .then((res) => {
      if (res.code === 0) {
        ShowTextTipsInfo(globalProperties, "创建比赛成功");
        modalShow.value = false;
        router.push({ path: "/collection/" + res.data.id });
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    })
    .finally(() => {
      confirmLoading.value = false;
    });
};

// 初始化分页信息
onMounted(async () => {
  viewActive = true;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      collectionSearchForm.value.title = (newQuery.title as string) || "";
      collectionSearchForm.value.username = (newQuery.username as string) || "";
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
      fetchData({ current: currentPage, pageSize: currentPageSize }, true);
    },
    { immediate: true }
  );
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
    <t-col :span="9">
      <t-card style="margin: 10px">
        <t-table
          :data="collectionViews"
          :columns="listColumns"
          row-key="id"
          vertical-align="top"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="onPageChange"
        />
      </t-card>
    </t-col>
    <t-col :span="3">
      <div style="margin: 10px">
        <t-card class="sh-card">
          <t-form :model="collectionSearchForm">
            <t-form-item label="标题">
              <t-input v-model="collectionSearchForm.title" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="负责人">
              <t-input v-model="collectionSearchForm.username" placeholder="仅支持输入完整用户名"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="handleSearchCollection">提交</t-button>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card">
          <t-space>
            <t-button @click="handleCreateCollection">创建</t-button>
          </t-space>
        </t-card>
      </div>
    </t-col>
  </t-row>

  <t-dialog v-model:visible="modalShow" header="创建比赛" @confirm="handleConfirmCreate" :confirm-loading="confirmLoading">
    <t-form :label-width="80" :model="collectionCreateForm" @submit.prevent>
      <t-form-item label="标题">
        <t-input v-model="collectionCreateForm.title" placeholder="请输入标题"></t-input>
      </t-form-item>
      <t-form-item label="开启时间">
        <t-date-range-picker enable-time-picker allow-input clearable v-model="collectionCreateForm.open_time" />
      </t-form-item>
    </t-form>
  </t-dialog>
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
