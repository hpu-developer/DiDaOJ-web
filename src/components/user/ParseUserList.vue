<script lang="tsx" setup>
import { ref, watch } from "vue";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, SplitIdStringsFromText } from "@/util/tips";
import { PostUserAccountInfoss, PostUserParse } from "@/apis/user.ts";
import { ParseValidType } from "@/util/parse.ts";
import { UserInfo } from "@/types/user.ts";
import type { ContestMember } from "@/types/contest.ts";

const { globalProperties } = useCurrentInstance();

defineOptions({ name: "ParseUserList" });

const showDialog = ref(false);
const isParsing = ref(false);
const textareaValue = ref("");

// 支持两种类型：number[] 或 { id: number; [key: string]: any }[]
const modelUserIds = defineModel<number[] | { id: number; [key: string]: any }[]>();
let filteredUserIds = [] as number[];

// 外部传入的配置
const props = defineProps<{
  // 附加信息的字段名
  extraField?: string;
  // 附加信息的列名
  extraColumnTitle?: string;
}>();

interface User {
  id: number;
  username: string;
  nickname: string;
  valid: number;
  [key: string]: any; // 支持动态字段
}

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
  // 动态附加信息列
  ...(props.extraField && props.extraColumnTitle ? [{
    title: props.extraColumnTitle,
    colKey: props.extraField,
    // 只有当存在附加信息时才显示该列
    visible: () => localViews.value && props.extraField && localViews.value.some(user => user[props.extraField!] && user[props.extraField!] !== ''),
  }] : []),
]);

const handleParseUserResponse = (res: any, usernamesWithExtra: Array<{ username: string; extra?: string }> | undefined, extraInfo?: Record<number, string>) => {
  if (res.code !== 0) {
    ShowErrorTips(globalProperties, res.code);
    isParsing.value = false;
    return;
  }

  const results: User[] = [];
  const fetched = res.data.users as UserInfo[];
  const extraField = props.extraField || 'extra';

  let finalUserIds = [] as number[];
  let finalUserObjects: { id: number; [key: string]: any }[] = [];
  if (usernamesWithExtra) {
    usernamesWithExtra.forEach(({ username, extra }) => {
      let matched = null;
      if (fetched) {
        matched = fetched.find((p) => p.username.toLowerCase() === username.toLowerCase());
      }
      if (matched) {
        const alreadyExists = results.find((p) => p.username.toLowerCase() === username.toLowerCase());
        const valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
        const userData: User = { 
          id: matched.id, 
          username: matched.username, 
          nickname: matched.nickname, 
          valid: valid,
        };
        // 添加附加信息
        if (extra) {
          userData[extraField] = extra;
        }
        results.push(userData);
        if (!alreadyExists) {
          finalUserIds.push(matched.id);
          const userObject: { id: number; [key: string]: any } = { id: matched.id };
          if (extra) {
            userObject[extraField] = extra;
          }
          finalUserObjects.push(userObject);
        }
      } else {
        const userData: User = { id: -1, username: username, nickname: "-", valid: ParseValidType.Invalid };
        // 添加附加信息
        if (extra) {
          userData[extraField] = extra;
        }
        results.push(userData);
      }
    });
  } else if (fetched) {
    fetched.forEach((user: UserInfo) => {
      const alreadyExists = results.find((p) => p.id === user.id);
      const valid = alreadyExists ? ParseValidType.Duplicate : ParseValidType.Valid;
      const userData: User = { 
        id: user.id, 
        username: user.username, 
        nickname: user.nickname, 
        valid: valid,
      };
      // 添加附加信息
      if (extraInfo?.[user.id]) {
        userData[extraField] = extraInfo[user.id];
      }
      results.push(userData);
      if (!alreadyExists) {
        finalUserIds.push(user.id);
        const userObject: { id: number; [key: string]: any } = { id: user.id };
        if (extraInfo?.[user.id]) {
          userObject[extraField] = extraInfo[user.id];
        }
        finalUserObjects.push(userObject);
      }
    });
  }
  localViews.value = results;
  filteredUserIds = finalUserIds;
  
  // 计算新的model值
  let newModelValue: number[] | { id: number; [key: string]: any }[];
  if (props.extraField || (modelUserIds.value && modelUserIds.value.length > 0 && typeof modelUserIds.value[0] !== 'number')) {
    // 如果有附加字段配置或原始数据是对象类型，使用对象数组格式
    newModelValue = finalUserObjects;
  } else {
    // 否则使用简单的ID数组格式
    newModelValue = finalUserIds;
  }
  
  // 只有当新值与当前值不同时才更新，避免递归
  if (JSON.stringify(newModelValue) !== JSON.stringify(modelUserIds.value)) {
    modelUserIds.value = newModelValue;
  }
};

const loadUserListByIds = async (userIds: number[] | { id: number; [key: string]: any }[]) => {
  // 提取出 id
  const ids = userIds.map(item => typeof item === 'number' ? item : item.id);
  const uniqueIds = Array.from(new Set(ids));
  const res = await PostUserAccountInfoss(uniqueIds);
  
  // 处理附加信息
  const extraField = props.extraField || 'extra';
  const extraInfo: Record<number, string> = {};
  if (userIds.length > 0 && typeof userIds[0] !== 'number') {
    userIds.forEach(member => {
      if (typeof member !== 'number' && member[extraField]) {
        extraInfo[member.id] = member[extraField];
      }
    });
  }
  
  handleParseUserResponse(res, undefined, extraInfo);
};

const loadUserListByUsernames = async (usernamesWithExtra: Array<{ username: string; extra?: string }>) => {
  // 提取用户名
  const usernames = usernamesWithExtra.map(item => item.username);
  const uniqueIds = Array.from(new Set(usernames));
  const res = await PostUserParse(uniqueIds);
  handleParseUserResponse(res, usernamesWithExtra);
};

const handleParse = async () => {
  isParsing.value = true;

  // 修改解析规则：每行一个用户，用户名和附加信息用空格分隔
  const lines = textareaValue.value.split('\n');
  const usernamesWithExtra: Array<{ username: string; extra?: string }> = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      // 分割用户名和附加信息（第一个空格之后的内容作为附加信息）
      const parts = trimmedLine.split(' ');
      const username = parts[0];
      const extra = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
      usernamesWithExtra.push({ username, extra });
    }
  });

  await loadUserListByUsernames(usernamesWithExtra);

  showDialog.value = false;
  isParsing.value = false;
};

const handleParseUser = () => {
  if (localViews.value) {
    const extraField = props.extraField || 'extra';
    textareaValue.value = localViews.value.map((v) => {
      // 格式：用户名 附加信息
      if (v[extraField]) {
        return `${v.username} ${v[extraField]}`;
      }
      return v.username;
    }).join("\n");
  } else {
    textareaValue.value = "";
  }
  showDialog.value = true;
};

watch(
  modelUserIds,
  async (newVal) => {
    // 检查是否为相同值，避免递归
    if (!newVal) {
      filteredUserIds = [];
      localViews.value = [];
      return;
    }
    
    // 比较当前值和新值，只有不同时才执行
    const isSame = JSON.stringify(newVal) === JSON.stringify(filteredUserIds);
    if (isSame) {
      return;
    }
    
    // 根据newVal的类型提取id值
    filteredUserIds = Array.isArray(newVal) && typeof newVal[0] === 'number' 
      ? newVal as number[] 
      : newVal.map((item: { id: number }) => item.id);
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

  <t-dialog v-model:visible="showDialog" @confirm="handleParse" header="请输入用户信息" :confirm-loading="isParsing">
    <div style="margin-bottom: 10px">
      <span>每行一个用户，格式：用户名 空格 附加信息（可选）</span>
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
