<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";

import { GetUserGenderKey, GetUserModifyInfo, PostUserModifyInfo, PostUserModifyPassword, PostUserModifyVjudge } from "@/apis/user.ts";
import { UserModifyInfo, UserModifyInfoRequest, UserModifyPasswordRequest, UserModifyVjudgeRequest } from "@/types/user.ts";

import router from "@/router";
import { useUserStore } from "@/stores/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const editTab = ref("1");

const formData = ref({
  nickname: "",
  slogan: "",
  gender: "",
  realName: "",
  organization: "",
});

const passwordFormData = ref({
  password: "",
  changePassword: "",
  confirmPassword: "",
});

const vjudgeNickname = ref("");
const vjudgeFormData = ref({
  approved: false,
  username: "",
});

const isPostRunning = ref(false);

const rePassword = (val: any) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(!passwordFormData.value.changePassword || passwordFormData.value.changePassword === val);
      clearTimeout(timer);
    });
  });

const formRules = ref({
  nickname: [
    { required: true, message: "请填写昵称" },
    { min: 1, message: "昵称至少1个字符" },
    { max: 30, message: "昵称最多30个字符" },
  ],
  slogan: [{ max: 100, message: "个性签名最多100个字符" }],
});

const passwordFormRules = ref({
  password: [
    { required: true, message: "请填写密码" },
    { min: 6, message: "密码至少6个字符" },
    { max: 20, message: "密码最多20个字符" },
  ],
  changePassword: [
    { min: 6, message: "密码至少6个字符" },
    { max: 20, message: "密码最多20个字符" },
  ],
  confirmPassword: [{ validator: rePassword, message: "两次密码不一致" }],
});

const userLoading = ref(false);
let loadedUserInfo = {} as UserModifyInfo;

const loadUserInfo = async () => {
  userLoading.value = true;
  try {
    let res = await GetUserModifyInfo();
    if (res.code !== 0) {
      userLoading.value = false;
      ShowErrorTips(globalProperties, res.code);
      await router.push({ name: "home" });
      return;
    }
    loadedUserInfo = res.data as UserModifyInfo;
    onResetBaseInfo();
    onResetVjudge();
  } catch (e) {
  } finally {
    userLoading.value = false;
  }
};

const onResetBaseInfo = () => {
  formData.value.nickname = loadedUserInfo.nickname;
  formData.value.slogan = loadedUserInfo.slogan;
  formData.value.gender = GetUserGenderKey(loadedUserInfo.gender);
  formData.value.realName = loadedUserInfo.real_name;
  formData.value.organization = loadedUserInfo.organization;
};

const onSubmitBaseInfo = async (_: any) => {
  isPostRunning.value = true;
  const requestData = {
    nickname: formData.value.nickname,
    slogan: formData.value.slogan,
    gender: formData.value.gender,
    real_name: formData.value.realName,
    organization: formData.value.organization,
  } as UserModifyInfoRequest;
  try {
    const res = await PostUserModifyInfo(requestData);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "保存成功");
      userStore.setNickname(formData.value.nickname);
      loadedUserInfo.nickname = formData.value.nickname;
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } finally {
    isPostRunning.value = false;
  }
};

const onResetPasswordInfo = async (_: any) => {
  passwordFormData.value.password = "";
  passwordFormData.value.changePassword = "";
  passwordFormData.value.confirmPassword = "";
};

const onSubmitPasswordInfo = async (_: any) => {
  if (passwordFormData.value.changePassword !== passwordFormData.value.confirmPassword) {
    return;
  }
  if (passwordFormData.value.password === passwordFormData.value.changePassword) {
    ShowTextTipsError(globalProperties, "请输入一个不同的密码");
    return;
  }
  isPostRunning.value = true;
  const requestData = {
    password: passwordFormData.value.password,
    new_password: passwordFormData.value.changePassword,
  } as UserModifyPasswordRequest;
  try {
    const res = await PostUserModifyPassword(requestData);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "保存成功");
      userStore.clear();
      globalProperties.$router.push({
        path: "/login",
      });
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } finally {
    isPostRunning.value = false;
  }
};

const onResetVjudge = () => {
  vjudgeNickname.value = "";
  vjudgeFormData.value.approved = false;
  vjudgeFormData.value.username = loadedUserInfo.vjudge_id;
};

const onSubmitVjudge = async (_: any) => {
  isPostRunning.value = true;
  const requestData = {
    approved: vjudgeFormData.value.approved,
    username: vjudgeFormData.value.username,
  } as UserModifyVjudgeRequest;
  try {
    const res = await PostUserModifyVjudge(requestData);
    if (res.code === 0) {
      if (requestData.approved || requestData.username == "") {
        ShowTextTipsInfo(globalProperties, "保存成功");
        loadedUserInfo.vjudge_id = requestData.username ? requestData.username : "";
        onResetVjudge();
      } else {
        vjudgeFormData.value.approved = true;
        vjudgeNickname.value = res.data;
        ShowTextTipsInfo(globalProperties, "请根据提示验证账号所有权");
      }
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } finally {
    isPostRunning.value = false;
  }
};

onMounted(() => {
  loadUserInfo();
});
</script>

<template>
  <t-card class="yj-login-card" title="欢迎使用DidaOJ~">
    <t-loading :loading="userLoading">
      <t-tabs v-model="editTab" style="min-width: 500px">
        <t-tab-panel value="1" label="基础信息" style="padding: 10px">
          <t-form
            ref="form"
            :rules="formRules"
            :data="formData"
            :colon="true"
            @reset="onResetBaseInfo"
            @submit="onSubmitBaseInfo"
            class="yj-modify-form"
          >
            <t-form-item name="nickname" label="昵称">
              <t-input v-model="formData.nickname" clearable placeholder="请输入昵称"></t-input>
            </t-form-item>
            <t-form-item name="slogan" label="Slogan">
              <t-input v-model="formData.slogan" clearable placeholder="请输入Slogan"></t-input>
            </t-form-item>
            <t-form-item name="slogan" label="性别">
              <t-select v-model="formData.gender" placeholder="请选择性别" clearable>
                <t-option key="0" value="unkown" label="保密"></t-option>
                <t-option key="1" value="male" label="男"></t-option>
                <t-option key="2" value="female" label="女"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item name="slogan" label="组织">
              <t-input v-model="formData.organization" clearable placeholder="请输入学校/公司/团体等"></t-input>
            </t-form-item>
            <t-form-item name="slogan" label="真实姓名">
              <t-input v-model="formData.realName" clearable placeholder="真实姓名仅用在部分需要实名的系统"></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="danger" type="reset" style="margin-right: 10px">重置</t-button>
              <t-button theme="primary" type="submit" block :loading="isPostRunning">保存</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
        <t-tab-panel value="2" label="安全信息" style="padding: 10px">
          <t-form
            ref="form"
            :rules="passwordFormRules"
            :data="passwordFormData"
            :colon="true"
            @reset="onResetPasswordInfo"
            @submit="onSubmitPasswordInfo"
            class="yj-modify-form"
          >
            <t-form-item name="password" label="当前密码">
              <t-input v-model="passwordFormData.password" clearable type="password" placeholder="请输入旧密码"></t-input>
            </t-form-item>
            <t-form-item name="changePassword" label="新密码">
              <t-input v-model="passwordFormData.changePassword" clearable type="password" placeholder="输入新密码"></t-input>
            </t-form-item>
            <t-form-item name="confirmPassword" label="确认密码">
              <t-input
                v-model="passwordFormData.confirmPassword"
                clearable
                type="password"
                autocomplete="current-password"
                placeholder="请确认新密码"
              ></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="danger" type="reset" style="margin-right: 10px">重置</t-button>
              <t-button theme="primary" type="submit" block :loading="isPostRunning">保存</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
        <t-tab-panel value="3" label="VJUDGE" style="padding: 10px">
          <t-alert>
            <span>本站支持绑定<a href="https://vjudge.net/" target="_blank">vjudge.net</a>账号，请输入目标用户名</span>
          </t-alert>
          <t-alert v-if="vjudgeNickname" style="margin-top: 10px; margin-bottom: 10px">
            <span>请将<a href="https://vjudge.net/" target="_blank">vjudge.net</a>的昵称修改为下方随机昵称，保存后可还原</span>
          </t-alert>
          <t-form ref="form" :colon="true" @reset="onResetVjudge" @submit="onSubmitVjudge" class="yj-modify-form">
            <t-form-item name="username" label="用户名">
              <t-input v-model="vjudgeFormData.username" clearable placeholder="请输入用户名"></t-input>
            </t-form-item>
            <t-form-item name="username" label="随机昵称" v-if="vjudgeNickname">
              <t-input v-model="vjudgeNickname" readonly st></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="danger" type="reset" style="margin-right: 10px">重置</t-button>
              <t-button theme="primary" type="submit" block :loading="isPostRunning">{{ vjudgeNickname ? "保存" : "绑定" }}</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
      </t-tabs>
    </t-loading>
  </t-card>
</template>

<style scoped>
.yj-login-card {
  width: 600px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.yj-modify-form {
  padding: 20px;
}
</style>
