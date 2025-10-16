<script setup lang="ts">
import { onMounted, ref } from "vue";
import { UserModifyInfo, UserModifyInfoRequest } from "@/types/user.ts";
import { GetUserModifyInfo, PostUserModifyInfo } from "@/apis/user.ts";
import { ShowErrorTips, ShowTextTipsInfo, useCurrentInstance } from "@/util";
import router from "@/router";
import { useUserStore } from "@/stores/user.ts";

const { globalProperties } = useCurrentInstance();

const userStore = useUserStore();

const formData = ref({
  nickname: "",
  slogan: "",
  password: "",
  confirmPassword: "",
});

const isPostRunning = ref(false);

const rePassword = (val: any) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(formData.value.password === val);
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
  password: [
    { required: true, message: "请填写密码" },
    { min: 6, message: "密码至少6个字符" },
    { max: 20, message: "密码最多20个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码" },
    { validator: rePassword, message: "两次密码不一致" },
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
    onReset();
  } catch (e) {
  } finally {
    userLoading.value = false;
  }
};

const onReset = () => {
  formData.value.nickname = loadedUserInfo.nickname;
  formData.value.slogan = loadedUserInfo.slogan;
  formData.value.password = "";
  formData.value.confirmPassword = "";
};

const onSubmit = async (_: any) => {
  isPostRunning.value = true;
  const requestData = {
    nickname: formData.value.nickname,
    slogan: formData.value.slogan,
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

onMounted(() => {
  loadUserInfo();
});
</script>

<template>
  <t-card class="yj-login-card" title="欢迎使用DidaOJ~">
    <t-loading :loading="userLoading">
      <t-form ref="form" :rules="formRules" :data="formData" :colon="true" @reset="onReset" @submit="onSubmit" class="yj-login-form">
        <t-form-item name="nickname" label="昵称">
          <t-input v-model="formData.nickname" clearable placeholder="请输入昵称"></t-input>
        </t-form-item>
        <t-form-item name="slogan" label="Slogan">
          <t-input v-model="formData.slogan" clearable placeholder="请输入Slogan"></t-input>
        </t-form-item>
        <t-form-item>
          <t-button theme="danger" type="reset" style="margin-right: 10px">重置</t-button>
          <t-button theme="primary" type="submit" block :loading="isPostRunning">保存</t-button>
        </t-form-item>
      </t-form>
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
.yj-login-form {
  width: 300px;
  padding: 20px;
}
</style>
