<script setup lang="tsx">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetJudgeDataDownload, GetProblemJudge, ParseProblem, PostJudgeData } from "@/apis/problem.ts";
import { ShowErrorParamTips, ShowErrorTips, ShowTextTipsError, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import { ProblemJudgeData, ProblemView } from "@/types/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const problemKey = ref("");
let problemId = 0;
const problemLoading = ref(false);

const problemData = ref<ProblemView | null>(null);

let problemJudgeZip = null as File | null;

const fileInput = ref(null as any);
const fileName = ref("");
const isDragging = ref(false);

const isUploading = ref(false);

const listColumns = ref([
  {
    title: "文件",
    colKey: "file",
  },
  {
    title: "大小",
    colKey: "size",
    width: 150,
    cell: (_: any, data: any) => {
      let size = data.row.size;
      let sizeStr;
      if (size > 10 * 1024) {
        if (size > 1024 * 1024) {
          sizeStr = (size / (1024 * 1024)).toFixed(3) + " MB";
        } else {
          sizeStr = (size / 1024).toFixed(3) + " KB";
        }
      } else {
        sizeStr = size + " B";
      }
      return sizeStr;
    },
  },
  {
    title: "最后编辑时间",
    colKey: "lastModified",
    width: 180,
    cell: (_: any, data: any) => {
      return new Date(data.row.lastModified).toLocaleString();
    },
  },
  {
    title: "操作",
    colKey: "action",
    width: 100,
    cell: (_: any, data: any) => {
      return <t-button onClick={() => handleClickDownloadFile(data.row.file)}>下载</t-button>;
    },
  },
]);

const fileViews = ref([] as any);

const dropZoneStyle = computed(() => ({
  border: "2px dashed #ccc",
  borderRadius: "6px",
  padding: "20px",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isDragging.value ? "#f0f9ff" : "#fff",
  transition: "background-color 0.2s ease",
}));

const dropText = computed(() => {
  if (fileName.value) return `已选择：${fileName.value}`;
  return isDragging.value ? "松开文件以上传" : "拖拽判题数据压缩包到这里，或点击选择文件";
});

const handleClickView = () => {
  router.push({
    name: "problem-detail",
    params: {
      problemKey: problemKey.value,
    },
  });
};

const handleClickEdit = () => {
  router.push({
    name: "manage-problem",
    params: {
      problemKey: problemKey.value,
    },
  });
};

const handleClickDownloadFile = async (key: string) => {
  const res = await GetJudgeDataDownload(problemId, key);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    return;
  }
  const link = document.createElement("a");
  link.href = res.data;
  link.target = "_blank";
  link.click();
  URL.revokeObjectURL(link.href);
};

const handleClickSave = async () => {
  if (!problemJudgeZip) {
    ShowTextTipsError(globalProperties, "请选择压缩包");
    return;
  }

  isUploading.value = true;

  PostJudgeData(problemId, problemJudgeZip)
    .then(async (res) => {
      if (res.code == 0) {
        fileInput.value.value = null;
        problemJudgeZip = null;
        fileName.value = "";
        problemLoading.value = true;

        ShowTextTipsSuccess(globalProperties, "上传成功");

        await loadProblem();
      } else {
        ShowErrorParamTips(globalProperties, res.code, res.data);
      }
    })
    .catch((err) => {
      console.log(err);
      globalProperties.$message.error({
        duration: 3000,
        content: "上传失败",
      });
    })
    .finally(() => {
      isUploading.value = false;
    });
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: any) => {
  const file = event.target.files[0];
  if (file) {
    fileName.value = file.name;
    problemJudgeZip = file;
  }
};

const handleDragEnter = (e) => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: any) => {
  event.preventDefault();
  event.stopPropagation(); // 这一行很关键！！！

  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    fileName.value = file.name;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.value.files = dataTransfer.files;

    problemJudgeZip = file;
  }
};

const loadProblem = async () => {
  const res = await GetProblemJudge(problemKey.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem" });
    return;
  }

  const problem = res.data.problem;

  problemId = problem.id

  problemData.value = ParseProblem(problem, {} as any);

  webStyleStore.setTitle(problem.title + " - " + webStyleStore.getTitle);

  fileViews.value = [];
  if (res.data.judges) {
    res.data.judges.forEach((judge: ProblemJudgeData) => {
      fileViews.value.push({
        file: judge.key,
        size: judge.size,
        lastModified: judge.last_modified,
      });
    });
    fileViews.value.sort((a, b) => {
      if (a.file.endsWith(".zip") && !b.file.endsWith(".zip")) return -1;
      if (!a.file.endsWith(".zip") && b.file.endsWith(".zip")) return 1;
      if (a.file.endsWith(".yaml") && !b.file.endsWith(".yaml")) return -1;
      if (!a.file.endsWith(".yaml") && b.file.endsWith(".yaml")) return 1;
      return 0;
    });
  } else {
    ShowTextTipsError(globalProperties, "评测数据不存在");
  }

  problemLoading.value = false;
};

onMounted(async () => {
  if (Array.isArray(route.params.problemKey)) {
    problemKey.value = route.params.problemKey[0];
  } else {
    problemKey.value = route.params.problemKey;
  }
  if (!problemKey.value) {
    ShowTextTipsError(globalProperties, "题目不存在");
    await router.push({ name: "problem" });
    return;
  }

  problemLoading.value = true;
  await loadProblem();
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <t-row>
      <t-col :span="7">
        <div style="margin: 10px">
          <div
            id="drop-zone"
            :style="dropZoneStyle"
            @click="triggerFileInput"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent
            @dragleave.prevent="handleDragLeave"
            @drop="handleDrop"
          >
            <input ref="fileInput" type="file" style="display: none" @change="handleFileChange" />
            {{ dropText }}
          </div>
        </div>
        <t-table :data="fileViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" />
      </t-col>
      <t-col :span="5">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space>
              <t-button @click="handleClickSave" theme="danger" :loading="isUploading">上传</t-button>
              <t-button @click="handleClickEdit" theme="warning">编辑</t-button>
              <t-button @click="handleClickView">查看</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="标题">{{ problemData?.title }}</t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ problemData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="判题方式">{{ problemData?.judgeType }}</t-descriptions-item>
            <t-descriptions-item label="评测数据">{{ problemData?.judgeMd5 }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{ problemData?.inserterNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}
</style>
