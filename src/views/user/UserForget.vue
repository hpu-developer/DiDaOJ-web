<script setup lang="tsx">
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useUserStore } from "@/stores/user.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostUserLoginForget, PostUserPasswordForget } from "@/apis/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const isPostRunning = ref(false);
const isSendEmailKeying = ref(false);
const isSendEmailKeyDisabled = ref(false);
const sendEmailButtonText = ref("发送验证码");
let sendEmailTime: any = null;
let sendEmailInterval = -1;

const dialogShow = ref(false);
const dialogContainer = ref(null as any);
const sendToEmail = ref("");

const formData = ref({
  username: "",
  emailKey: "",
  password: "",
  confirmPassword: "",
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
  emailKey: [
    { required: true, message: "请填写验证码" },
    { min: 6, message: "请输入完整验证码" },
    { max: 6, message: "请输入完整验证码" },
  ],
});

const onReset = () => {
  ShowTextTipsInfo(globalProperties, "重置成功");
};

const requestSendEmailKey = async (token: string) => {
  if (isSendEmailKeyDisabled.value) {
    return;
  }

  isPostRunning.value = true;
  isSendEmailKeying.value = true;
  try {
    const res = await PostUserLoginForget(token, formData.value.username);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "验证码发送成功");
      sendToEmail.value = res.data;

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
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (e) {
    console.error("Send email key error", e);
    ShowTextTipsError(globalProperties, "发送验证码失败");
  } finally {
    isPostRunning.value = false;
  }
};

const handleSendEmailKey = async () => {
  dialogShow.value = true;
  if (isSendEmailKeyDisabled.value) {
    return;
  }
  if (isSendEmailKeying.value) {
    return;
  }

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

const confirmEmail = ref(() => (
  <t-button onClick={handleSendEmailKey} disabled={isSendEmailKeyDisabled.value} loading={isSendEmailKeying.value} style="width:120px">
    {sendEmailButtonText.value}
  </t-button>
));

const handleModifyPassword = async () => {
  isPostRunning.value = true;
  try {
    const res = await PostUserPasswordForget(formData.value.username, formData.value.password, formData.value.emailKey);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "密码修改成功");
      globalProperties.$router.push({ name: "login" });
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (e) {
    console.error("Modify password error", e);
    ShowTextTipsError(globalProperties, "修改密码失败");
  } finally {
    isPostRunning.value = false;
  }
};

const onSubmit = async ({ validateResult, firstError, e }: any) => {
  if (isPostRunning.value) {
    return;
  }
  e.preventDefault();
  if (validateResult !== true) {
    ShowTextTipsError(globalProperties, firstError);
    return;
  }

  if (sendToEmail.value) {
    await handleModifyPassword();
  } else {
    await handleSendEmailKey();
  }
};

onMounted(() => {
  if (userStore.isLogin()) {
    globalProperties.$router.push({ path: "/user" });
    return;
  }
});

onBeforeUnmount(() => {});
</script>

<template>
  <t-card class="yj-login-card" title="欢迎使用DidaOJ~">
    <t-alert :max-line="1">
      <span>如果您未绑定邮箱或忘记用户名，可联系管理员寻求帮助</span>
      <span>管理员邮箱：BoilTask@qq.com</span>
    </t-alert>
    <t-alert style="margin-top: 10px">
      <p>支持原acm.hpu.edu.cn、CodeOJ的用户直接登录</p>
      <p>原DMOJ、hpuoj.com的用户，请先重置密码</p>
      <p>可尝试学号/昵称等作为用户名登录，成功后有机会合并账户或修改用户名</p>
    </t-alert>
    <t-form ref="form" :rules="formRules" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form">
      <t-form-item name="username" label="用户名">
        <t-input v-model="formData.username" clearable placeholder="请输入完整用户名"></t-input>
      </t-form-item>
      <template v-if="sendToEmail">
        <t-form-item name="email" label="发送邮箱">
          <t-input-adornment :append="confirmEmail">
            <div style="display: flex; align-items: center">
              <span style="color: #409eff; margin-right: 20px">{{ sendToEmail }}</span>
            </div>
          </t-input-adornment>
        </t-form-item>
        <t-form-item name="emailKey" label="验证码">
          <t-input v-model="formData.emailKey" clearable placeholder="请输入收到的验证码"></t-input>
        </t-form-item>
        <t-form-item name="password" label="新密码">
          <t-input v-model="formData.password" type="password" clearable placeholder="新密码"></t-input>
        </t-form-item>
        <t-form-item name="confirmPassword" label="确认密码">
          <t-input v-model="formData.confirmPassword" type="password" clearable placeholder="请重复输入密码"></t-input>
        </t-form-item>
      </template>
      <t-form-item v-if="sendToEmail">
        <t-button theme="primary" type="submit" block :loading="isPostRunning">修改密码</t-button>
      </t-form-item>
      <t-form-item v-else>
        <t-button theme="primary" type="submit" block :loading="isPostRunning">重置密码</t-button>
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
