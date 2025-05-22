<script setup lang="tsx">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useUserStore } from "@/stores/user.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { DesktopIcon, LockOnIcon } from "tdesign-icons-vue-next";
import { PostUserRegisterEmailKey, PostUserRegister } from "@/apis/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const isRegisterRunning = ref(false);
const isSendEmailKeying = ref(false);
const isSendEmailKeyDisabled = ref(false);
const sendEmailButtonText = ref("发送验证码");
let sendEmailTime: any = null;
let sendEmailInterval = -1;

const formData = ref({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  emailKey: "",
});

const confirmEmail = ref(() => (
  <t-button onClick={handleSendEmailKey} disabled={isSendEmailKeyDisabled.value} loading={isSendEmailKeying.value} style="width:120px">
    {sendEmailButtonText.value}
  </t-button>
));

const handleSendEmailKey = async () => {
  if (isSendEmailKeyDisabled.value) {
    return;
  }

  isSendEmailKeying.value = true;

  try {
    const res = await PostUserRegisterEmailKey(formData.value.email);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }
    ShowTextTipsInfo(globalProperties, "发送验证码成功");
    isSendEmailKeying.value = false;
    isSendEmailKeyDisabled.value = true;
    sendEmailTime = new Date();
    sendEmailButtonText.value = `60秒后重发`;
    sendEmailInterval = setInterval(() => {
      const nowTime = new Date();
      const countdown = Math.floor((nowTime.getTime() - sendEmailTime?.getTime()) / 1000);
      if (countdown > 60) {
        sendEmailButtonText.value = "发送验证码";
        isSendEmailKeyDisabled.value = false;
        clearInterval(sendEmailInterval);
      } else {
        sendEmailButtonText.value = `${60 - countdown}秒后重发`;
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

const onSubmit = ({ validateResult, firstError }: any) => {
  if (isRegisterRunning.value) {
    return;
  }
  if (formData.value.password !== formData.value.confirmPassword) {
    ShowTextTipsError(globalProperties, "两次密码不一致");
    return;
  }

  isRegisterRunning.value = true;
  PostUserRegister(formData.value.username, formData.value.password, formData.value.email, formData.value.emailKey, "")
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
    <t-form ref="form" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form" :label-width="0">
      <t-form-item name="account">
        <t-input v-model="formData.username" clearable placeholder="请输入用户名">
          <template #prefix-icon>
            <DesktopIcon />
          </template>
        </t-input>
      </t-form-item>

      <t-form-item name="password">
        <t-input v-model="formData.password" type="password" clearable placeholder="请输入密码">
          <template #prefix-icon>
            <LockOnIcon />
          </template>
        </t-input>
      </t-form-item>
      <t-form-item name="confirm-password">
        <t-input v-model="formData.confirmPassword" type="password" clearable placeholder="请确认密码">
          <template #prefix-icon>
            <LockOnIcon />
          </template>
        </t-input>
      </t-form-item>
      <t-form-item name="email">
        <t-input v-model="formData.email" clearable placeholder="邮箱">
          <template #prefix-icon>
            <LockOnIcon />
          </template>
        </t-input>
      </t-form-item>
      <t-form-item name="emailKey">
        <t-input-adornment :append="confirmEmail">
          <t-input v-model="formData.emailKey" clearable placeholder="验证码" style="width: 240px">
            <template #prefix-icon>
              <LockOnIcon />
            </template>
          </t-input>
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
</template>

<style scoped>
.yj-login-card {
  width: 500px;
  height: 500px;
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
</style>
