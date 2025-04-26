<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const ListColumns = ref([
  {
    title: "ID",
    colKey: "problemId",
  },
  {
    title: "标题",
    colKey: "title",
  },
  {
    title: "标签",
    colKey: "tags",
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

let currentPage = 1;
let currentPageSize = 50;

const pagination = ref({
  defaultPageSize: currentPageSize,
  defaultCurrent: currentPage,
  total: 0,
  pageSizeOptions: [50, 100],
});

const tableData = ref([]);
const tagsData = ref([]);

for (let i = 0; i < 100; i++) {
  tableData.value.push({
    problemId: i + 3,
    title: "A/B",
    tags: ["数学", "模拟"],
    accept: Math.floor(Math.random() * 100),
    attempt: Math.floor(Math.random() * 200),
  });
}

for (let i = 0; i < 10; i++) {
  tagsData.value.push({
    name: "数学" + i,
    id: i,
  });
}

pagination.value.total = 100;

const formItem = ref({
  selectBranchList: [],
  modify: "",
});

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};
</script>

<template>
  <t-row>
    <t-col :span="9">
      <t-card style="margin: 10px">
        <t-table
          :data="tableData"
          :columns="ListColumns"
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
          <t-form :model="formItem">
            <t-form-item label="标题">
              <t-input v-model="formItem.modify" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item label="标签">
              <t-input v-model="formItem.modify" placeholder="暂不支持模糊查询"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary">提交</t-button>
            </t-form-item>
          </t-form>
        </t-card>
        <t-card class="sh-card sh-background-black">
          <t-button v-for="tag in tagsData" class="sh-tag-button" theme="default" variant="outline" :ghost="true" @click="() => $router.push('/')">
            {{ tag.name }}
          </t-button>
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
