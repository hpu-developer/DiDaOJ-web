<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import Vditor from "vditor";
import { GetContestEdit, ParseContest, PostContestCreate, PostContestEdit } from "@/apis/contest.ts";
import { ShowErrorTips, ShowTextTipsSuccess, SplitIdNumbersFromText, SplitIdsFromText, SplitIdStringsFromText, useCurrentInstance } from "@/util";
import { useWebStyleStore } from "@/stores/webStyle.ts";
import type { ContestEditRequest, ContestView } from "@/types/contest.ts";
import type { ProblemView } from "@/types/problem.ts";
import { UserInfoView } from "@/types/user.ts";
import { PostUserParse } from "@/apis/user.ts";
import { PostProblemParse } from "@/apis/problem.ts";

let route = useRoute();
const { globalProperties } = useCurrentInstance();

const webStyleStore = useWebStyleStore();

const contestId = ref("");
const contestLoading = ref(false);
let descriptionEditor = null as Vditor | null;
const isEditing = ref(false);

const showDialog = ref(false);

const contestData = ref<ContestView | null>(null);

const contestEditForm = ref({
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
    contestEditForm.value.problems = [];
    problemViews.value.forEach((v) => {
      contestEditForm.value.problems.push(v.id);
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

    contestEditForm.value.users = [];
    userViews.value.forEach((v) => {
      contestEditForm.value.users.push(v.id);
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
      title: contestEditForm.value.title,
      description: descriptionEditor.getValue(),
      problems: contestEditForm.value.problems,
      users: contestEditForm.value.users,
      start_time: contestEditForm.value.openTime[0],
      end_time: contestEditForm.value.openTime[1],
      private: contestEditForm.value.private,
    } as ContestEditRequest;
    const res = await PostContestCreate(postData);

    isEditing.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      await router.push({
        name: "contest-detail",
        params: { contestId: res.data },
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
      id: Number(contestId.value),
      title: contestEditForm.value.title,
      private: contestEditForm.value.private,
      problems: contestEditForm.value.problems,
      users: contestEditForm.value.users,
      description: descriptionEditor.getValue(),
    };
    if (contestEditForm.value.openTime[0]) {
      postData.start_time = new Date(contestEditForm.value.openTime[0]);
    }
    if (contestEditForm.value.openTime[1]) {
      postData.end_time = new Date(contestEditForm.value.openTime[1]);
    }
    const res = await PostContestEdit(postData);

    isEditing.value = true;

    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    if (res.data != undefined) {
      contestData.value.updateTime = new Date(res.data).toLocaleString();
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
      contestLoading.value = false;
    },
  } as IOptions;
  descriptionEditor = new Vditor("contestEditDiv", codeEditOptions);
};

const loadContest = async () => {
  const res = await GetContestEdit(contestId.value, undefined, undefined);
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    console.error("contest get failed", res.code);
    await router.push({ name: "problem-contest-list" });
    return;
  }

  const contest = res.data.contest;

  contestData.value = await ParseContest(contest);

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

  contestEditForm.value.title = contest.title;
  contestEditForm.value.openTime = [] as (Date | string)[];
  if (contest.start_time) {
    contestEditForm.value.openTime.push(new Date(contest.start_time));
  } else {
    contestEditForm.value.openTime.push(""); // 默认开始时间为当前时间
  }
  if (contest.end_time) {
    contestEditForm.value.openTime.push(new Date(contest.end_time));
  } else {
    contestEditForm.value.openTime.push(""); // 默认结束时间为当前时间加一天
  }
  contestEditForm.value.private = contest.private;
  contestEditForm.value.description = contest.description;

  // problemViews.value.sort((a, b) => {
  //   if (a.id.length === b.id.length) {
  //     return a.id.localeCompare(b.id);
  //   }
  //   return a.id.length - b.id.length;
  // });

  contestEditForm.value.problems = [];
  problemViews.value.forEach((v) => {
    contestEditForm.value.problems.push(v.id);
  });

  contestEditForm.value.users = [];
  userViews.value.forEach((v) => {
    contestEditForm.value.users.push(v.id);
  });

  webStyleStore.setTitle(contest.title + " - " + webStyleStore.getTitle);

  let contestDescription = "";
  if (contest.description) {
    contestDescription = contest.description as string;
  }

  loadDescriptionEditor(contestDescription);
};

onMounted(async () => {
  if (Array.isArray(route.params.contestId)) {
    contestId.value = route.params.contestId[0];
  } else {
    contestId.value = route.params.contestId;
  }

  if (contestId.value) {
    contestLoading.value = true;
    await loadContest();
  } else {
    loadDescriptionEditor("");
  }
});
</script>

<template>
  <t-loading :loading="contestLoading">
    <t-row>
      <t-col :span="8">
        <div style="margin: 10px">
          <t-card class="sh-card">
            <t-form :model="contestEditForm">
              <t-form-item label="标题">
                <t-input v-model="contestEditForm.title" placeholder="问题标题"></t-input>
              </t-form-item>
              <t-form-item label="开启时间">
                <t-date-range-picker
                  v-model="contestEditForm.openTime"
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
            <t-space v-if="contestId">
              <t-button @click="handleClickSave" theme="danger" :loading="isEditing">保存</t-button>
            </t-space>
            <t-space v-else>
              <t-button @click="handleClickCreate" theme="danger" :loading="isEditing">创建</t-button>
            </t-space>
          </div>
          <t-descriptions layout="vertical" :bordered="true" v-if="contestId">
            <t-descriptions-item label="创建时间">{{ contestData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ contestData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户">{{ contestData?.authorNickname }}</t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
    <div id="contestEditDiv" class="dida-description-editor"></div>
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
