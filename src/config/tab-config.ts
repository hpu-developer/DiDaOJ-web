import { Tab } from "@/types/webStyle.ts";

import HomeView from "@/views/HomeView.vue";
import View404 from "@/views/View404.vue";
import LoginView from "@/views/login/LoginView.vue";
import UserView from "@/views/user/UserView.vue";

import type { RouteRecordRaw } from "vue-router";

const tabsConfig: Tab[] = [
  {
    name: "home",
    path: "/",
    title: "首页",
    showSidebar: false,
    disableGenerateTab: true,
    component: HomeView,
  },
  {
    name: "problem",
    path: "/problem",
    title: "题目",
    icon: "dashboard",
    showSidebar: true,
    redirect: "problem-list",
  },
  {
    name: "judge",
    path: "/judge",
    title: "评测",
    icon: "dashboard",
    showSidebar: true,
    redirect: "judge-list",
  },
  {
    name: "login",
    path: "/login",
    title: "登陆",
    showSidebar: false,
    disableGenerateTab: true,
    component: LoginView,
  },
  {
    name: "user",
    path: "/user",
    title: "用户",
    showSidebar: false,
    needLogin: true,
    disableGenerateTab: true,
    component: UserView,
  },
  {
    name: "404",
    path: "/404",
    title: "404",
    showSidebar: false,
    disableGenerateTab: true,
    component: View404,
  },

];

export const getTabConfig = (tabName: string) => {
  return tabsConfig.find((tab) => tab.name == tabName);
};

export const getGenerateTabs = () => {
  const tabs = [] as Tab[];
  tabsConfig.forEach((tab) => {
    if (!tab.disableGenerateTab) {
      tabs.push(tab);
    }
  });
  return tabs;
};

export const makeTabRouter = (routers: RouteRecordRaw[]) => {
  tabsConfig.forEach((tab) => {
    const router = {
      name: tab.name,
      path: tab.path,
      meta: {
        title: tab.title,
        tab: tab.name,
        showSidebar: tab.showSidebar,
        needLogin: tab.needLogin,
        redirect: tab.redirect,
      },
      component: tab.component,
    } as RouteRecordRaw;

    routers.push(router);
  });
};
