<script setup lang="tsx">
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useUserStore } from "@/stores/user.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { PostUserLoginForget } from "@/apis/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const isRegisterRunning = ref(false);

const dialogShow = ref(false);
const dialogContainer = ref(null as any);

const formData = ref({
  username: "",
});

const formRules = ref({
  username: [
    { required: true, message: "请填写用户名" },
    { min: 4, message: "用户名至少4个字符" },
    { max: 20, message: "用户名最多20个字符" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "用户名只能包含字母、数字和下划线" },
  ],
});

const onReset = () => {
  ShowTextTipsInfo(globalProperties, "重置成功");
};

const requestSendEmailKey = async (token: string) => {
  isRegisterRunning.value = true;
  try {
    const res = await PostUserLoginForget(token, formData.value.username);
    if (res.code === 0) {
      ShowTextTipsInfo(globalProperties, "验证码发送成功");
      globalProperties.$router.push({ name: "register" });
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (e) {
    console.error("Send email key error", e);
    ShowTextTipsError(globalProperties, "发送验证码失败");
  } finally {
    isRegisterRunning.value = false;
  }
};

const onSubmit = async ({ validateResult, firstError, e }: any) => {
  if (isRegisterRunning.value) {
    return;
  }
  e.preventDefault();
  if (validateResult !== true) {
    ShowTextTipsError(globalProperties, firstError);
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
    <t-form ref="form" :rules="formRules" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form">
      <t-form-item name="username" label="用户名">
        <t-input v-model="formData.username" clearable placeholder="请输入完整用户名"></t-input>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" type="submit" block :loading="isRegisterRunning">重置密码</t-button>
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

  <t-dialog v-model:visible="dialogShow" header="请完成人机验证" :close-btn="false" :footer="false">
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
