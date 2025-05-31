<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import Vditor from "vditor";
import { GetCollectionEdit, ParseCollection, PostCollectionCreate, PostCollectionEdit } from "@/apis/collection.ts";
import { formatDate, ShowErrorTips, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { CollectionView } from "@/types/collection.ts";
import type { ProblemView } from "@/types/problem.ts";
import { UserInfoView } from "@/types/user.ts";
import { PostUserParse } from "@/apis/user.ts";
import { PostProblemParse } from "@/apis/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const collectionId = ref("");
const collectionLoading = ref(false);
let descriptionEditor = null as Vditor | null;
const isEditing = ref(false);

const showDialog = ref(false);

const collectionData = ref<CollectionView | null>(null);

const collectionEditForm = ref({
  title: "",
  openTime: [],
  private: true,
  problems: [] as string[],
  users: [] as number[],
});

const listColumns = ref([
  {
    title: "问题ID",
    colKey: "id",
  },
  {
    title: "标题",
    colKey: "title",
  },
]);

const userColumns = ref([
  {
    title: "Username",
    colKey: "username",
  },
  {
    title: "昵称",
    colKey: "nickname",
  },
]);

const problemViews = ref<ProblemView[]>([]);

const userViews = ref<UserInfoView[]>([]);

const parseDialogTitle = ref<string>("");
const textareaValue = ref("");
let parseFunction = null;
const isParsing = ref(false);

const handleParseProblem = async () => {
  showDialog.value = true;
  parseDialogTitle.value = "请输入问题ID";

  textareaValue.value = "";
  problemViews.value.forEach((v) => {
    textareaValue.value += `${v.id}\n`;
  });

  parseFunction = async () => {
    const res = await PostProblemParse(textareaValue.value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    problemViews.value = res.data.problems;
    collectionEditForm.value.problems = [];
    problemViews.value.forEach((v) => {
      collectionEditForm.value.problems.push(v.id);
    });
  };
};

const handleParseUser = async () => {
  showDialog.value = true;
  parseDialogTitle.value = "请输入username";

  textareaValue.value = "";
  userViews.value.forEach((v) => {
    textareaValue.value += `${v.username}\n`;
  });

  parseFunction = async () => {
    const res = await PostUserParse(textareaValue.value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    userViews.value = res.data.users;
    collectionEditForm.value.users = [];
    userViews.value.forEach((v) => {
      collectionEditForm.value.users.push(v.id);
    });
  };
};

const handleParse = async () => {
  isParsing.value = true;
  if (parseFunction) {
    await parseFunction();
  }
  showDialog.value = false;
  isParsing.value = false;
};

const handleClickCreate = async () => {
  if (!descriptionEditor) {
    return;
  }

  isEditing.value = true;

  collectionEditForm.value.tags = [];
  for (let i = 0; i < collectionTags.value.length; i++) {
    const tag = collectionTags.value[i];
    if (tag && tag.label) {
      collectionEditForm.value.tags.push(tag.label);
    }
  }

  try {
    const res = await PostCollectionCreate(
      collectionEditForm.value.title,
      collectionEditForm.value.timeLimit,
      collectionEditForm.value.memoryLimit,
      collectionEditForm.value.source,
      collectionEditForm.value.private,
      collectionEditForm.value.tags,
      descriptionEditor.getValue()
    );

    isEditing.value = true;

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
    isEditing.value = false;
  }
};

const handleClickSave = async () => {
  if (!descriptionEditor) {
    return;
  }

  isEditing.value = true;

  try {
    const postData = {
      id: Number(collectionId.value),
      title: collectionEditForm.value.title,
      private: collectionEditForm.value.private,
      problems: collectionEditForm.value.problems,
      users: collectionEditForm.value.users,
      description: descriptionEditor.getValue(),
    };
    if (collectionEditForm.value.openTime[0]) {
      postData.start_time = formatDate(collectionEditForm.value.openTime[0]);
    }
    if (collectionEditForm.value.openTime[1]) {
      postData.end_time = formatDate(collectionEditForm.value.openTime[1]);
    }
    const res = await PostCollectionEdit(postData);

    isEditing.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      collectionData.value.updateTime = new Date(res.data).toLocaleString();
    }

    ShowTextTipsSuccess(globalProperties, "保存成功");
  } finally {
    isEditing.value = false;
  }
};

const loadDescriptionEditor = (description: string) => {
  const codeEditOptions = {
    after: () => {
      descriptionEditor?.setValue(description);
      collectionLoading.value = false;
    },
  } as IOptions;
  descriptionEditor = new Vditor("collectionEditDiv", codeEditOptions);
};

const loadCollection = async () => {
  const res = await GetCollectionEdit(collectionId.value, undefined, undefined);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("collection get failed", res.code);
    await router.push({ name: "collection" });
    return;
  }

  const collection = res.data.collection;

  collectionData.value = await ParseCollection(collection, {} as any);

  problemViews.value = res.data.problems;
  userViews.value = res.data.users;

  collectionEditForm.value.title = collection.title;
  collectionEditForm.value.openTime = [];
  if (collectionData.value.startTime) {
    collectionEditForm.value.openTime.push(new Date(collectionData.value.startTime));
  } else {
    collectionEditForm.value.openTime.push(undefined);
  }
  if (collectionData.value.endTime) {
    collectionEditForm.value.openTime.push(new Date(collectionData.value.endTime));
  } else {
    collectionEditForm.value.openTime.push(undefined);
  }
  collectionEditForm.value.private = collection.private;
  collectionEditForm.value.description = collection.description;

  collectionEditForm.value.problems = [];
  problemViews.value.forEach((v) => {
    collectionEditForm.value.problems.push(v.id);
  });

  collectionEditForm.value.users = [];
  userViews.value.forEach((v) => {
    collectionEditForm.value.users.push(v.id);
  });

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
                <t-input v-model="collectionEditForm.title" placeholder="问题标题"></t-input>
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
              <t-form-item label="问题">
                <div class="dida-form-border">
                  <div style="text-align: right">
                    <t-button @click="handleParseProblem">编辑</t-button>
                  </div>
                  <t-table :data="problemViews" :columns="listColumns" row-key="id" vertical-align="top" :hover="true" />
                </div>
              </t-form-item>
              <t-form-item label="成员">
                <div class="dida-form-border">
                  <div style="text-align: right">
                    <t-button @click="handleParseUser">编辑</t-button>
                  </div>
                  <t-table :data="userViews" :columns="userColumns" row-key="id" vertical-align="top" :hover="true" />
                </div>
              </t-form-item>
            </t-form>
          </t-card>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div class="dida-edit-container">
            <t-space v-if="collectionId">
              <t-button @click="handleClickSave" theme="danger" :loading="isEditing">保存</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isEditing">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="collectionId">
            <t-descriptions-item label="创建时间">{{ collectionData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ collectionData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ collectionData?.authorNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div id="collectionEditDiv" class="dida-description-editor"></div>
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
  max-width: calc(100vw - 300px);
  min-height: 500px;
  z-index: 9999 !important;
}

.dida-form-border {
  border: rgba(75, 75, 75, 0.3) 1px solid;
  padding: 10px;
  border-radius: 5px;
}
</style>
