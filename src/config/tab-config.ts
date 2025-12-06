import { Tab } from "@/types/webStyle.ts";

import HomeView from "@/views/HomeView.vue";
import StudyView from "@/views/extra/StudyView.vue";
import View404 from "@/views/View404.vue";
import LoginView from "@/views/user/LoginView.vue";
import RegisterView from "@/views/user/RegisterView.vue";
import UserView from "@/views/user/UserView.vue";
import UserModify from "@/views/user/UserModify.vue";

import type { RouteRecordRaw } from "vue-router";
import { AuthType } from "@/auth";

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
    icon: "calculation",
    showSidebar: true,
    redirect: "problem-list",
  },
  {
    name: "collection-detail-tab",
    title: "题集",
    path: "/collection",
    showSidebar: true,
    disableGenerateTab: true,
    redirect: "problem-collection-list",
  },
  {
    name: "judge",
    path: "/judge",
    title: "评测",
    icon: "code",
    showSidebar: true,
    redirect: "judge-list",
  },
  {
    name: "contest",
    path: "/contest",
    title: "比赛",
    icon: "application",
    showSidebar: true,
    redirect: "contest-list",
  },
  {
    name: "contest-detail-tab",
    title: "比赛",
    path: "/contest",
    showSidebar: true,
    disableGenerateTab: true,
    redirect: "contest-list",
  },
  {
    name: "discuss",
    title: "讨论",
    path: "/discuss",
    icon: "sonic",
    showSidebar: true,
    redirect: "discuss-list",
  },
  {
    name: "discuss-detail-tab",
    title: "讨论",
    path: "/discuss",
    showSidebar: true,
    disableGenerateTab: true,
    redirect: "discuss-list",
  },
  {
    name: "rank",
    path: "/rank",
    title: "排名",
    icon: "chart-column",
    showSidebar: true,
    redirect: "rank-ac-all",
  },
  {
    name: "study",
    path: "/study",
    title: "研习",
    icon: "book-open",
    showSidebar: false,
    component: StudyView,
  },
  {
    name: "system",
    path: "/system",
    title: "系统",
    icon: "dashboard",
    showSidebar: true,
    redirect: "system-status",
  },
  {
    name: "manage",
    path: "/manage",
    title: "管理",
    icon: "command",
    showSidebar: true,
    redirect: "manage-web",
    auths: [AuthType.ManageWeb],
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
    name: "register",
    path: "/register",
    title: "注册",
    showSidebar: false,
    disableGenerateTab: true,
    component: RegisterView,
  },

  {
    name: "user",
    path: "/user/:username+",
    title: "用户",
    showSidebar: false,
    disableGenerateTab: true,
    component: UserView,
  },
  {
    name: "user-modify",
    path: "/user",
    title: "用户信息",
    showSidebar: false,
    disableGenerateTab: true,
    component: UserModify,
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

export const getGenerateTabs = (userStore: any) => {
  const tabs = [] as Tab[];
  tabsConfig.forEach((tab) => {
    if (!tab.disableGenerateTab && userStore.hasAllAuths(tab.auths)) {
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
        tabAuths: tab.auths,
      },
      component: tab.component,
    } as RouteRecordRaw;

    routers.push(router);
  });
};
