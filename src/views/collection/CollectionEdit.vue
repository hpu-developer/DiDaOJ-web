<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import Vditor from "vditor";
import { GetCollectionEdit, ParseCollection, PostCollectionCreate, PostCollectionEdit } from "@/apis/collection.ts";
import { ShowErrorTips, ShowTextTipsSuccess, SplitIdNumbersFromText, SplitIdsFromText, SplitIdStringsFromText, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { CollectionEditRequest, CollectionView } from "@/types/collection.ts";
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
  openTime: [] as (Date | string)[],
  private: true,
  problems: [] as string[],
  users: [] as number[],
  description: "",
});

enum ParseValidType {
  Valid = 0,
  Duplicate = 1,
  Invalid = 2,
}

const listColumns = ref([
  {
    title: "有效性",
    colKey: "validType",
    cell: (_: any, data: any) => {
      switch (data.row.valid) {
        case ParseValidType.Valid:
          return <t-tag theme="success">有效</t-tag>;
        case ParseValidType.Duplicate:
          return <t-tag theme="warning">重复</t-tag>;
        case ParseValidType.Invalid:
          return <t-tag theme="danger">无效</t-tag>;
        default:
          break;
      }
    },
  },
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
    title: "有效性",
    colKey: "validType",
    cell: (_: any, data: any) => {
      switch (data.row.valid) {
        case ParseValidType.Valid:
          return <t-tag theme="success">有效</t-tag>;
        case ParseValidType.Duplicate:
          return <t-tag theme="warning">重复</t-tag>;
        case ParseValidType.Invalid:
          return <t-tag theme="danger">无效</t-tag>;
        default:
          break;
      }
    },
  },
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
let parseFunction = null as (() => Promise<void>) | null;
const isParsing = ref(false);

const handleParseProblem = async () => {
  showDialog.value = true;
  parseDialogTitle.value = "请输入问题ID";

  textareaValue.value = "";
  problemViews.value.forEach((v) => {
    textareaValue.value += `${v.id}\n`;
  });

  parseFunction = async () => {
    const problemIds = SplitIdStringsFromText(textareaValue.value);
    const uniqueProblemIds = Array.from(new Set(problemIds));
    const res = await PostProblemParse(uniqueProblemIds);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    problemViews.value = [];
    const responseProblems = res.data.problems as Problem[];
    problemIds.forEach((id) => {
      let problem = null;
      if (responseProblems) {
        problem = responseProblems.find((p) => p.id === id);
      }
      if (problem) {
        // 判断是否重复
        const existingProblem = problemViews.value.find((p) => p.id === id);
        if (existingProblem) {
          problem.valid = ParseValidType.Duplicate;
        } else {
          problem.valid = ParseValidType.Valid;
        }
        problemViews.value.push({
          valid: problem.valid,
          id: id,
          title: problem.title,
        });
      } else {
        problemViews.value.push({
          valid: ParseValidType.Invalid,
          id: id,
          title: "-",
        });
      }
    });
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
    const usernames = SplitIdStringsFromText(textareaValue.value);
    const res = await PostUserParse(usernames);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    userViews.value = [];
    usernames.sort((a, b) => {
      return a.username.localeCompare(b.username);
    });
    usernames.forEach((username) => {
      let user = null;
      if (res.data.users) {
        user = res.data.users.find((u: UserInfoView) => u.username === username);
      }
      if (user) {
        // 判断是否重复
        const existingUser = userViews.value.find((u) => u.id === user.id);
        if (existingUser) {
          user.valid = ParseValidType.Duplicate;
        } else {
          user.valid = ParseValidType.Valid;
        }
        userViews.value.push(user);
      } else {
        userViews.value.push({
          id: -1,
          username: username,
          nickname: "-",
          valid: ParseValidType.Invalid,
        });
      }
    });

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

  try {
    const postData = {
      title: collectionEditForm.value.title,
      description: descriptionEditor.getValue(),
      problems: collectionEditForm.value.problems,
      users: collectionEditForm.value.users,
      start_time: collectionEditForm.value.openTime[0],
      end_time: collectionEditForm.value.openTime[1],
      private: collectionEditForm.value.private,
    } as CollectionEditRequest;
    const res = await PostCollectionCreate(postData);

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
      postData.start_time = new Date(collectionEditForm.value.openTime[0]);
    }
    if (collectionEditForm.value.openTime[1]) {
      postData.end_time = new Date(collectionEditForm.value.openTime[1]);
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
    await router.push({ name: "problem-collection-list" });
    return;
  }

  const collection = res.data.collection;

  collectionData.value = await ParseCollection(collection);

  problemViews.value = [];
  if (res.data.problems) {
    res.data.problems.forEach((problem) => {
      problem.valid = ParseValidType.Valid;
      problemViews.value.push(problem);
    });
  }
  userViews.value = [];
  if (res.data.users && res.data.users.length > 0) {
    res.data.users.forEach((user: UserInfoView) => {
      user.valid = ParseValidType.Valid;
      userViews.value.push(user);
    });
  }

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

  // problemViews.value.sort((a, b) => {
  //   if (a.id.length === b.id.length) {
  //     return a.id.localeCompare(b.id);
  //   }
  //   return a.id.length - b.id.length;
  // });

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
