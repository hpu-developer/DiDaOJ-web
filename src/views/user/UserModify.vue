<script setup lang="tsx">
import { nextTick, onMounted, ref } from "vue";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";

import {
  GetUserGenderKey,
  GetUserModifyInfo,
  PostUserModifyEmail,
  PostUserModifyEmailKey,
  PostUserModifyInfo,
  PostUserModifyOldEmailKey,
  PostUserModifyPassword,
  PostUserModifyVjudge,
  PostUserRegisterEmailKey,
} from "@/apis/user.ts";
import { UserModifyEmailRequest, UserModifyInfo, UserModifyInfoRequest, UserModifyPasswordRequest, UserModifyVjudgeRequest } from "@/types/user.ts";

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

const emailFormData = ref({
  email: "",
  emailKey: "",
  newEmail: "",
  newEmailKey: "",
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

const emailFormRules = ref({
  emailKey: [
    { required: true, message: "请填写验证码" },
    { min: 6, message: "请输入完整验证码" },
    { max: 6, message: "请输入完整验证码" },
  ],
  newEmail: [
    { required: true, message: "请填写邮箱" },
    { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: "邮箱格式不正确" },
  ],
  newEmailKey: [
    { required: true, message: "请填写验证码" },
    { min: 6, message: "请输入完整验证码" },
    { max: 6, message: "请输入完整验证码" },
  ],
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
    onResetEmail();
    onResetPasswordInfo();
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

const onResetPasswordInfo = (_: any) => {
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
      ShowTextTipsInfo(globalProperties, "密码修改成功，请重新登录");
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

const sendOldEmailButtonText = ref("发送验证码");
const isSendOldEmailKeying = ref(false);
const isSendOldEmailKeyDisabled = ref(false);
let sendOldEmailTime: any = null;
let sendOldEmailInterval = -1;
const sendNewEmailButtonText = ref("发送验证码");
const isSendNewEmailKeying = ref(false);
const isSendNewEmailKeyDisabled = ref(false);
let sendNewEmailTime: any = null;
let sendNewEmailInterval = -1;

const dialogShow = ref(false);
const dialogContainer = ref(null as any);

const requestSendOldEmailKey = async (token: string) => {
  if (isSendOldEmailKeyDisabled.value) {
    return;
  }

  isSendOldEmailKeying.value = true;

  try {
    const res = await PostUserModifyOldEmailKey(token);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "发送验证码成功");
    isSendOldEmailKeying.value = false;
    isSendOldEmailKeyDisabled.value = true;
    sendOldEmailTime = new Date();
    sendOldEmailButtonText.value = `60 秒后重发`;
    sendOldEmailInterval = setInterval(() => {
      const nowTime = new Date();
      const countdown = Math.floor((nowTime.getTime() - sendOldEmailTime?.getTime()) / 1000);
      if (countdown > 60) {
        sendOldEmailButtonText.value = "发送验证码";
        isSendOldEmailKeyDisabled.value = false;
        clearInterval(sendOldEmailInterval);
      } else {
        sendOldEmailButtonText.value = `${60 - countdown} 秒后重发`;
      }
    }, 1000);
  } catch (e) {
    ShowTextTipsError(globalProperties, "发送验证码失败");
  } finally {
    isSendOldEmailKeying.value = false;
  }
};

const requestSendNewEmailKey = async (token: string) => {
  if (isSendNewEmailKeyDisabled.value) {
    return;
  }

  isSendNewEmailKeying.value = true;

  try {
    const res = await PostUserModifyEmailKey(token, emailFormData.value.newEmail);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "发送验证码成功");
    isSendNewEmailKeying.value = false;
    isSendNewEmailKeyDisabled.value = true;
    sendNewEmailTime = new Date();
    sendNewEmailButtonText.value = `60 秒后重发`;
    sendNewEmailInterval = setInterval(() => {
      const nowTime = new Date();
      const countdown = Math.floor((nowTime.getTime() - sendNewEmailTime?.getTime()) / 1000);
      if (countdown > 60) {
        sendNewEmailButtonText.value = "发送验证码";
        isSendNewEmailKeyDisabled.value = false;
        clearInterval(sendNewEmailInterval);
      } else {
        sendNewEmailButtonText.value = `${60 - countdown} 秒后重发`;
      }
    }, 1000);
  } catch (e) {
    ShowTextTipsError(globalProperties, "发送验证码失败");
  } finally {
    isSendNewEmailKeying.value = false;
  }
};

const handleSendOldEmailKey = async () => {
  if (!emailFormData.value.email) {
    ShowTextTipsError(globalProperties, "暂无验证邮箱");
    return;
  }
  if (!emailFormData.value.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    ShowTextTipsError(globalProperties, "邮箱格式不正确");
    return;
  }
  if (isSendOldEmailKeyDisabled.value) {
    return;
  }
  if (isSendOldEmailKeying.value) {
    return;
  }

  dialogShow.value = true;

  await nextTick(); // 等待 modal 渲染完成

  // 确保 cf-confirm-div 只添加一次
  const confirmDiv = document.getElementById("cf-confirm-div");
  if (confirmDiv) {
    confirmDiv.remove();
  }

  const div = document.createElement("div");
  div.id = "cf-confirm-div";
  div.setAttribute("data-theme", "light");
  dialogContainer.value?.appendChild(div);

  const windowRef = window as any;
  windowRef.turnstile.ready(function () {
    windowRef.turnstile.render("#cf-confirm-div", {
      sitekey: "0x4AAAAAABeM4SYPu2Rn7PmI",
      callback: async function (token: string) {
        dialogShow.value = false;
        await requestSendOldEmailKey(token);
      },
      "before-interactive-callback": function () {
        console.log("before-interactive-callback");
      },
    });
  });
};

const handleSendNewEmailKey = async () => {
  if (!emailFormData.value.newEmail) {
    ShowTextTipsError(globalProperties, "请输入新邮箱");
    return;
  }
  if (!emailFormData.value.newEmail.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    ShowTextTipsError(globalProperties, "邮箱格式不正确");
    return;
  }
  if (emailFormData.value.newEmail === emailFormData.value.email) {
    ShowTextTipsError(globalProperties, "新邮箱不能与原邮箱相同");
    return;
  }
  if (isSendNewEmailKeyDisabled.value) {
    return;
  }
  if (isSendNewEmailKeying.value) {
    return;
  }

  dialogShow.value = true;

  await nextTick(); // 等待 modal 渲染完成

  // 确保 cf-confirm-div 只添加一次
  const confirmDiv = document.getElementById("cf-confirm-div");
  if (confirmDiv) {
    confirmDiv.remove();
  }

  const div = document.createElement("div");
  div.id = "cf-confirm-div";
  div.setAttribute("data-theme", "light");
  dialogContainer.value?.appendChild(div);

  const windowRef = window as any;
  windowRef.turnstile.ready(function () {
    windowRef.turnstile.render("#cf-confirm-div", {
      sitekey: "0x4AAAAAABeM4SYPu2Rn7PmI",
      callback: async function (token: string) {
        dialogShow.value = false;
        await requestSendNewEmailKey(token);
      },
      "before-interactive-callback": function () {
        console.log("before-interactive-callback");
      },
    });
  });
};

const oldSendEmailRender = ref(() => (
  <t-button onClick={handleSendOldEmailKey} disabled={isSendOldEmailKeyDisabled.value} loading={isSendOldEmailKeying.value}>
    {sendOldEmailButtonText.value}
  </t-button>
));

const newSendEmailRender = ref(() => (
  <t-button onClick={handleSendNewEmailKey} disabled={isSendNewEmailKeyDisabled.value} loading={isSendNewEmailKeying.value}>
    {sendNewEmailButtonText.value}
  </t-button>
));

const onResetEmail = (_: any) => {
  emailFormData.value.email = loadedUserInfo.email;
  emailFormData.value.emailKey = "";
  emailFormData.value.newEmail = "";
  emailFormData.value.newEmailKey = "";
};

const onSubmitEmail = async (_: any) => {
  if (!emailFormData.value.newEmail.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    ShowTextTipsError(globalProperties, "新邮箱格式不正确");
    return;
  }
  if (emailFormData.value.newEmail === emailFormData.value.email) {
    ShowTextTipsError(globalProperties, "新邮箱不能与原邮箱相同");
    return;
  }
  if (!emailFormData.value.newEmailKey || emailFormData.value.newEmailKey.length !== 6) {
    ShowTextTipsError(globalProperties, "请输入新邮箱验证码");
    return;
  }
  if (!emailFormData.value.emailKey || emailFormData.value.emailKey.length !== 6) {
    ShowTextTipsError(globalProperties, "请输入原邮箱验证码");
    return;
  }
  isPostRunning.value = true;
  const requestData = {
    email_key: emailFormData.value.emailKey,
    new_email: emailFormData.value.newEmail,
    new_email_key: emailFormData.value.newEmailKey,
  } as UserModifyEmailRequest;
  try {
    const res = await PostUserModifyEmail(requestData);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "邮箱修改成功，请重新登录");
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
        <t-tab-panel value="3" label="邮件信息" style="padding: 10px">
          <t-alert :max-line="1">
            <span>如果您的原邮箱无法接受验证码，可联系管理员寻求帮助</span>
            <span>管理员邮箱：BoilTask@qq.com</span>
          </t-alert>
          <t-form
            ref="form"
            :rules="emailFormRules"
            :data="emailFormData"
            :colon="true"
            @reset="onResetEmail"
            @submit="onSubmitEmail"
            class="yj-modify-form"
          >
            <t-form-item name="email" label="原邮箱">
              <t-input v-model="emailFormData.email" readonly></t-input>
            </t-form-item>
            <t-form-item name="emailKey" label="原邮箱验证码">
              <t-input-adornment :append="oldSendEmailRender">
                <t-input v-model="emailFormData.emailKey" clearable placeholder="请输入验证码"></t-input>
              </t-input-adornment>
            </t-form-item>
            <t-form-item name="newEmail" label="新邮箱">
              <t-input v-model="emailFormData.newEmail" clearable placeholder="请输入新邮箱"></t-input>
            </t-form-item>
            <t-form-item name="newEmailKey" label="新邮箱验证码">
              <t-input-adornment :append="newSendEmailRender">
                <t-input v-model="emailFormData.newEmailKey" clearable placeholder="请输入验证码"></t-input>
              </t-input-adornment>
            </t-form-item>
            <t-form-item>
              <t-button theme="danger" type="reset" style="margin-right: 10px">重置</t-button>
              <t-button theme="primary" type="submit" block :loading="isPostRunning">保存</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
        <t-tab-panel value="4" label="VJUDGE" style="padding: 10px">
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
              <t-input v-model="vjudgeNickname" readonly></t-input>
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
  <t-dialog v-model:visible="dialogShow" header="正在加载人机验证" :close-btn="false" :footer="false">
    <div ref="dialogContainer" class="cf-confirm-container"></div>
  </t-dialog>
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
