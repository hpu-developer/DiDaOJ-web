<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useDeveloperStore } from "@/stores/developer.ts";
import { ShowErrorTips, useCurrentInstance } from "@/util";

const { globalProperties } = useCurrentInstance();

const developerStore = useDeveloperStore();

const isLoaded = ref(false);
const isLoggingIn = ref(false);

const appId = ref("");

const gotoUrl = ref("");

const formData = reactive({
  account: "",
  password: "",
});

const onReset = () => {
  MessagePlugin.success("重置成功");
};

const onSubmit = ({ validateResult, firstError }) => {
  if (validateResult === true) {
    MessagePlugin.success("提交成功");
  } else {
    console.log("Validate Errors: ", firstError, validateResult);
    MessagePlugin.warning(firstError);
  }
};

function handleLoginError() {
  isLoggingIn.value = false;
  globalProperties.$message.error({
    duration: 3000,
    content: "登录失败",
  });
  refreshPage();
}

function refreshPage() {
  isLoaded.value = false;
  isLoadedFailed.value = false;
  isLoggingIn.value = false;

  const newQuery = JSON.parse(JSON.stringify(globalProperties.$route.query)); // 深拷贝
  delete newQuery.code;
  globalProperties.$router.replace({ query: newQuery });
  globalProperties.$router.push({ path: "/login" });
}

onMounted(() => {});
</script>

<template>
  <t-card class="yj-login-card">
    <t-form ref="form" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form">
      <t-form-item label="用户名" name="account">
        <t-input v-model="formData.account" clearable placeholder="请输入账户名">
          <template #prefix-icon>
            <DesktopIcon />
          </template>
        </t-input>
      </t-form-item>

      <t-form-item label="密码" name="password">
        <t-input v-model="formData.password" type="password" clearable placeholder="请输入密码">
          <template #prefix-icon>
            <lock-on-icon />
          </template>
        </t-input>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" type="submit" block>登录</t-button>
      </t-form-item>
    </t-form>
    <div>
      <t-button>忘记密码</t-button>
      <t-button>注册账户</t-button>
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
  width: 100%;
  padding: 20px;
}
</style>
