<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUserStore } from "@/stores/user.ts";
import { ShowErrorTips, ShowTextTipsError, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import { DesktopIcon, LockOnIcon } from "tdesign-icons-vue-next";
import { RequestLogin } from "@/apis/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const isLoginRunning = ref(false);

const formData = ref({
  account: "",
  password: "",
});

const onReset = () => {
  ShowTextTipsInfo(globalProperties, "重置成功");
};

const onSubmit = ({ validateResult, firstError }: any) => {
  if (isLoginRunning.value) {
    return;
  }
  RequestLogin(formData.value.account, formData.value.password)
    .then((res) => {
      if (res.code === 0) {
        userStore.loadResponse(res.data);
        ShowTextTipsInfo(globalProperties, "登录成功");
        let redirectUri = globalProperties.$route.query.redirect_uri as string;
        if (!redirectUri) {
          redirectUri = "/user/" + res.data.username;
        }
        globalProperties.$router.push({ path: redirectUri });
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    })
    .catch((e) => {
      console.error("Login error", e);
      ShowTextTipsError(globalProperties, "登录失败");
    });
};

onMounted(() => {
  if (userStore.isLogin()) {
    globalProperties.$router.push({ path: "/user" });
    return;
  }
});
</script>

<template>
  <t-card class="yj-login-card" title="欢迎使用DidaOJ~">
    <t-form ref="form" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form" :label-width="0">
      <t-form-item name="account">
        <t-input v-model="formData.account" clearable placeholder="请输入账户名">
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
      <t-form-item>
        <t-button theme="primary" type="submit" block :loading="isLoginRunning">登录</t-button>
      </t-form-item>
    </t-form>
    <div class="dida-login-footer">
      <t-link @click="() => { globalProperties.$router.push({ name: 'login-forget' }) }">忘记密码</t-link>
      <t-link @click="() => { globalProperties.$router.push({ name: 'register' }) }">注册账户</t-link>
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
  width: 300px;
  padding: 20px;
}

.dida-login-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
</style>
