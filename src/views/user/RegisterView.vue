<script setup lang="tsx">
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useUserStore } from "@/stores/user.ts";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo } from "@/util/tips";
import { PostUserRegisterEmailKey, PostUserRegister } from "@/apis/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const isRegisterRunning = ref(false);
const isSendEmailKeying = ref(false);
const isSendEmailKeyDisabled = ref(false);
const sendEmailButtonText = ref("发送验证码");
let sendEmailTime: any = null;
let sendEmailInterval = -1;

const dialogShow = ref(false);
const dialogContainer = ref(null as any);

const formData = ref({
  username: "",
  password: "",
  confirmPassword: "",
  nickname: "",
  gender: "",
  realName: "",
  organization: "",
  email: "",
  emailKey: "",
});

const rePassword = (val: any) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(formData.value.password === val);
      clearTimeout(timer);
    });
  });

const formRules = ref({
  username: [
    { required: true, message: "请填写用户名" },
    { min: 4, message: "用户名至少4个字符" },
    { max: 20, message: "用户名最多20个字符" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "用户名只能包含字母、数字和下划线" },
  ],
  password: [
    { required: true, message: "请填写密码" },
    { min: 6, message: "密码至少6个字符" },
    { max: 20, message: "密码最多20个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码" },
    { validator: rePassword, message: "两次密码不一致" },
  ],
  nickname: [
    { required: true, message: "请填写昵称" },
    { min: 1, message: "昵称至少1个字符" },
    { max: 30, message: "昵称最多30个字符" },
  ],
  organization: [{ max: 30, message: "组织最多30个字符" }],
  email: [
    { required: true, message: "请填写邮箱" },
    { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: "邮箱格式不正确" },
  ],
  emailKey: [
    { required: true, message: "请填写验证码" },
    { min: 6, message: "请输入完整验证码" },
    { max: 6, message: "请输入完整验证码" },
  ],
});

const confirmEmail = ref(() => (
  <t-button onClick={handleSendEmailKey} disabled={isSendEmailKeyDisabled.value} loading={isSendEmailKeying.value} style="width:120px">
    {sendEmailButtonText.value}
  </t-button>
));

const handleSendEmailKey = async () => {
  if (!formData.value.email) {
    ShowTextTipsError(globalProperties, "请输入邮箱");
    return;
  }
  if (!formData.value.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    ShowTextTipsError(globalProperties, "邮箱格式不正确");
    return;
  }
  if (isSendEmailKeyDisabled.value) {
    return;
  }
  if (isSendEmailKeying.value) {
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
        await requestSendEmailKey(token);
      },
      "before-interactive-callback": function () {
        console.log("before-interactive-callback");
      },
    });
  });
};

const requestSendEmailKey = async (token: string) => {
  if (isSendEmailKeyDisabled.value) {
    return;
  }

  isSendEmailKeying.value = true;

  try {
    const res = await PostUserRegisterEmailKey(token, formData.value.email);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "发送验证码成功");
    isSendEmailKeying.value = false;
    isSendEmailKeyDisabled.value = true;
    sendEmailTime = new Date();
    sendEmailButtonText.value = `60 秒后重发`;
    sendEmailInterval = setInterval(() => {
      const nowTime = new Date();
      const countdown = Math.floor((nowTime.getTime() - sendEmailTime?.getTime()) / 1000);
      if (countdown > 60) {
        sendEmailButtonText.value = "发送验证码";
        isSendEmailKeyDisabled.value = false;
        clearInterval(sendEmailInterval);
      } else {
        sendEmailButtonText.value = `${60 - countdown} 秒后重发`;
      }
    }, 1000);
  } catch (e) {
    ShowTextTipsError(globalProperties, "发送验证码失败");
  } finally {
    isSendEmailKeying.value = false;
  }
};

const onReset = () => {
  ShowTextTipsInfo(globalProperties, "重置成功");
};

const onSubmit = ({ validateResult, firstError, e }: any) => {
  if (isRegisterRunning.value) {
    return;
  }
  e.preventDefault();
  if (validateResult !== true) {
    ShowTextTipsError(globalProperties, firstError);
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    ShowTextTipsError(globalProperties, "两次密码不一致");
    return;
  }

  isRegisterRunning.value = true;
  PostUserRegister(
    formData.value.username,
    formData.value.password,
    formData.value.email,
    formData.value.emailKey,
    formData.value.nickname,
    formData.value.gender,
    formData.value.realName,
    formData.value.organization
  )
    .then((res) => {
      if (res.code === 0) {
        ShowTextTipsInfo(globalProperties, "注册成功，可使用账号信息登录");
        globalProperties.$router.push({ name: "login" });
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    })
    .catch((e) => {
      console.error("Login error", e);
      ShowTextTipsError(globalProperties, "登录失败");
    })
    .finally(() => {
      isRegisterRunning.value = false;
    });
};

onMounted(() => {
  if (userStore.isLogin()) {
    globalProperties.$router.push({ path: "/user" });
    return;
  }
});

onBeforeUnmount(() => {
  clearInterval(sendEmailInterval);
});
</script>

<template>
  <t-card class="yj-login-card" title="欢迎使用DidaOJ~">
    <t-form ref="form" :rules="formRules" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form">
      <t-form-item name="username" label="用户名">
        <t-input v-model="formData.username" clearable placeholder="用于登录与查找"></t-input>
      </t-form-item>

      <t-form-item name="password" label="密码">
        <t-input v-model="formData.password" type="password" clearable placeholder="请输入密码"></t-input>
      </t-form-item>
      <t-form-item name="confirmPassword" label="确认密码">
        <t-input v-model="formData.confirmPassword" type="password" clearable placeholder="请确认密码"></t-input>
      </t-form-item>
      <t-form-item name="nickname" label="昵称">
        <t-input v-model="formData.nickname" clearable placeholder="用于优先在网站各处展示"></t-input>
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
      <t-form-item name="email" label="邮箱">
        <t-input v-model="formData.email" clearable placeholder="请填写常用邮箱"></t-input>
      </t-form-item>
      <t-form-item name="emailKey" label="验证码">
        <t-input-adornment :append="confirmEmail">
          <t-input v-model="formData.emailKey" clearable placeholder="请输入验证码" style="width: 140px"></t-input>
        </t-input-adornment>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" type="submit" block :loading="isRegisterRunning">注册</t-button>
      </t-form-item>
    </t-form>
    <div class="dida-login-footer">
      <t-link
        @click="
          () => {
            globalProperties.$router.push({ name: 'login' });
          }
        "
        >返回登陆
      </t-link>
    </div>
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

.yj-login-form {
  width: 400px;
  padding: 20px;
}

.dida-login-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cf-confirm-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
