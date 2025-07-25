<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetCollectionEdit, ParseCollection, PostCollectionCreate, PostCollectionEdit } from "@/apis/collection.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { CollectionEditRequest, CollectionView } from "@/types/collection.ts";
import ParseProblemList from "@/components/problem/ParseProblemList.vue";
import ParseUserList from "@/components/user/ParseUserList.vue";
import type { UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const collectionId = ref("");
const collectionLoading = ref(false);
const isSaving = ref(false);

const showDialog = ref(false);

const collectionData = ref<CollectionView | null>(null);

const collectionEditForm = ref({
  title: "",
  openTime: [] as (Date | string)[],
  private: true,
  problems: [] as string[],
  members: [] as number[],
  description: "",
});

const parseDialogTitle = ref<string>("");
const textareaValue = ref("");
let parseFunction = null as (() => Promise<void>) | null;
const isParsing = ref(false);

const handleParse = async () => {
  isParsing.value = true;
  if (parseFunction) {
    await parseFunction();
  }
  showDialog.value = false;
  isParsing.value = false;
};

const handleClickCreate = async () => {
  isSaving.value = true;

  try {
    const postData = {
      title: collectionEditForm.value.title,
      problems: collectionEditForm.value.problems,
      members: collectionEditForm.value.members,
      private: collectionEditForm.value.private,
      description: collectionEditForm.value.description,
    } as CollectionEditRequest;
    if (collectionEditForm.value.openTime[0]) {
      postData.start_time = new Date(collectionEditForm.value.openTime[0]);
    }
    if (collectionEditForm.value.openTime[1]) {
      postData.end_time = new Date(collectionEditForm.value.openTime[1]);
    }
    const res = await PostCollectionCreate(postData);

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      await router.push({
        name: "collection-detail",
        params: { collectionId: res.data },
      });
    }

    ShowTextTipsSuccess(globalProperties, "创建成功");
  } finally {
    isSaving.value = false;
  }
};

const handleClickSave = async () => {
  isSaving.value = true;

  try {
    const postData = {
      id: Number(collectionId.value),
      title: collectionEditForm.value.title,
      private: collectionEditForm.value.private,
      problems: collectionEditForm.value.problems,
      members: collectionEditForm.value.members,
      description: collectionEditForm.value.description,
    } as CollectionEditRequest;
    if (collectionEditForm.value.openTime[0]) {
      postData.start_time = new Date(collectionEditForm.value.openTime[0]);
    }
    if (collectionEditForm.value.openTime[1]) {
      postData.end_time = new Date(collectionEditForm.value.openTime[1]);
    }
    const res = await PostCollectionEdit(postData);

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      if (collectionData.value) {
        collectionData.value.updateTime = new Date(res.data).toLocaleString();
      }
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isSaving.value = false;
  }
};

const loadDescriptionEditor = (description: string) => {
  collectionEditForm.value.description = description;
  collectionLoading.value = false;
};

async function handleUploadImg(files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) {
  isSaving.value = true;
  // await HandleR2ImageUpload(files, callback, globalProperties, () => {
  //   return null;
  // });
  ShowTextTipsError(globalProperties, "本界面暂不支持上传图片");
  isSaving.value = false;
}

const loadCollection = async () => {
  const res = await GetCollectionEdit(collectionId.value);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("collection get failed", res.code);
    await router.push({ name: "problem-collection-list" });
    return;
  }

  const collection = res.data.collection;

  collectionData.value = ParseCollection(collection);

  collectionEditForm.value.title = collection.title;
  collectionEditForm.value.openTime = [] as (Date | string)[];
  if (collection.start_time) {
    collectionEditForm.value.openTime.push(new Date(collection.start_time));
  } else {
    collectionEditForm.value.openTime.push(""); // 默认开始时间为当前时间
  }
  if (collection.end_time) {
    collectionEditForm.value.openTime.push(new Date(collection.end_time));
  } else {
    collectionEditForm.value.openTime.push(""); // 默认结束时间为当前时间加一天
  }
  collectionEditForm.value.private = collection.private;
  collectionEditForm.value.description = collection.description;

  collectionEditForm.value.problems = collection.problems;
  collectionEditForm.value.members = collection.members;

  webStyleStore.setTitle(collection.title + " - " + webStyleStore.getTitle);

  let collectionDescription = "";
  if (collection.description) {
    collectionDescription = collection.description as string;
  }

  loadDescriptionEditor(collectionDescription);
};

onMounted(async () => {
  if (Array.isArray(route.params.collectionId)) {
    collectionId.value = route.params.collectionId[0];
  } else {
    collectionId.value = route.params.collectionId;
  }

  if (collectionId.value) {
    collectionLoading.value = true;
    await loadCollection();
  } else {
    loadDescriptionEditor("");
  }
});
</script>

<template>
  <t-loading :loading="collectionLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-card">
            <t-form :model="collectionEditForm">
              <t-form-item label="标题">
                <t-input v-model="collectionEditForm.title" placeholder="题集标题"></t-input>
              </t-form-item>
              <t-form-item label="开启时间">
                <t-date-range-picker
                  v-model="collectionEditForm.openTime"
                  allow-input
                  clearable
                  format="YYYY-MM-DD HH:mm:ss"
                  :default-time="['00:00:00', '23:59:59']"
                />
              </t-form-item>
              <t-form-item label="私有">
                <t-switch v-model="collectionEditForm.private" />
              </t-form-item>
              <t-form-item label="成员">
                <ParseUserList v-model="collectionEditForm.members" />
              </t-form-item>
              <t-form-item label="问题">
                <ParseProblemList v-model="collectionEditForm.problems" />
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="collectionId">
              <t-button @click="handleClickSave" theme="danger" :loading="isSaving">保存</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isSaving">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="collectionId">
            <t-descriptions-item label="创建时间">{{ collectionData?.createTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ collectionData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ collectionData?.inserterNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <md-editor-v3
      id="collection-description-editor"
      v-model="collectionEditForm.description"
      @save="handleClickSave"
      @onUploadImg="handleUploadImg"
      previewTheme="cyanosis"
      class="dida-description-editor"
    />
    <t-loading :loading="isSaving" attach="#collection-description-editor" :z-index="100000"></t-loading>
  </t-loading>
  <t-dialog v-model:visible="showDialog" @confirm="handleParse" :header="parseDialogTitle" :confirm-loading="isParsing">
    <div style="margin-bottom: 10px">
      <span>多条请以空格、换行、英文逗号隔开</span>
    </div>
    <t-textarea v-model="textareaValue" :autosize="{ minRows: 5 }"></t-textarea>
  </t-dialog>
</template>

<style scoped>
.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-description-editor {
  margin: 20px;
  width: 100%;
}
</style>
