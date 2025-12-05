<script lang="tsx" setup>
import { ref, watch } from "vue";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, SplitIdStringsFromText } from "@/util/tips";
import { PostUserAccountInfoss, PostUserParse, PostUserParseByIds } from "@/apis/user.ts";
import { ParseValidType } from "@/util/parse.ts";
import { UserInfo } from "@/types/user.ts";

const { globalProperties } = useCurrentInstance();

defineOptions({ name: "ParseUserList" });

const showDialog = ref(false);
const isParsing = ref(false);
const textareaValue = ref("");

const modelUserIds = defineModel<number[]>();
let filteredUserIds = [] as number[];

const localViews = ref<User[]>();

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
    title: "Username",
    colKey: "username",
  },
  {
    title: "昵称",
    colKey: "nickname",
  },
]);

const handleParseUserResponse = (res: any, usernames: string[]) => {
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    isParsing.value = false;
    return;
  }

  const results: User[] = [];
  const fetched = res.data.users as UserInfo[];

  let finalUserIds = [];
  if (usernames) {
    usernames.forEach((username) => {
      let matched = null;
      if (fetched) {
        matched = fetched.find((p) => p.username.toLowerCase() === username.toLowerCase());
      }
      if (matched) {
        const alreadyExists = results.find((p) => p.username.toLowerCase() === username.toLowerCase());
        const valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
        results.push({ id: matched.id, username: matched.username, nickname: matched.nickname, valid: valid });
        if (!alreadyExists) {
          finalUserIds.push(matched.id);
        }
      } else {
        results.push({ id: -1, username: username, nickname: "-", valid: ParseValidType.Invalid });
      }
    });
  } else if (fetched) {
    fetched.forEach((user: UserInfo) => {
      const alreadyExists = results.find((p) => p.id === user.id);
      const valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
      results.push({ id: user.id, username: user.username, nickname: user.nickname, valid: valid });
      if (!alreadyExists) {
        finalUserIds.push(user.id);
      }
    });
  }
  localViews.value = results;
  filteredUserIds = finalUserIds;
  modelUserIds.value = finalUserIds;
};

const loadUserListByIds = async (userIds: number[]) => {
  const uniqueIds = Array.from(new Set(userIds));
  const res = await PostUserAccountInfoss(uniqueIds);
  handleParseUserResponse(res);
};

const loadUserListByUsernames = async (usernames: string[]) => {
  const uniqueIds = Array.from(new Set(usernames));
  const res = await PostUserParse(uniqueIds);
  handleParseUserResponse(res, usernames);
};

const handleParse = async () => {
  isParsing.value = true;

  const inputIds = SplitIdStringsFromText(textareaValue.value);

  await loadUserListByUsernames(inputIds);

  showDialog.value = false;
  isParsing.value = false;
};

const handleParseUser = () => {
  if (localViews.value) {
    textareaValue.value = localViews.value.map((v) => v.username).join("\n");
  } else {
    textareaValue.value = "";
  }
  showDialog.value = true;
};

watch(
  modelUserIds,
  async (newVal) => {
    if (JSON.stringify(newVal) === JSON.stringify(filteredUserIds)) {
      return;
    }
    if (!newVal) {
      filteredUserIds = [];
      return;
    }
    filteredUserIds = newVal;
    await loadUserListByIds(newVal);
  },
  {
    deep: true,
    immediate: true,
  }
);

</script>

<template>
  <div class="dida-form-border">
    <div style="text-align: right">
      <t-button @click="handleParseUser">编辑</t-button>
    </div>
    <t-table :data="localViews" :columns="listColumns" row-key="id" vertical-align="top" table-layout="auto" :hover="true" />
  </div>

  <t-dialog v-model:visible="showDialog" @confirm="handleParse" header="请输入用户Username" :confirm-loading="isParsing">
    <div style="margin-bottom: 10px">
      <span>多条请以空格、换行、英文逗号隔开</span>
    </div>
    <t-textarea v-model="textareaValue" :autosize="{ minRows: 5 }" />
  </t-dialog>
</template>

<style scoped>
.dida-form-border {
  border: rgba(75, 75, 75, 0.3) 1px solid;
  padding: 10px;
  border-radius: 5px;
  min-width: 100%;
}
</style>
