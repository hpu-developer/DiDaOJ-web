import { getTabConfig } from "./tab-config";

import type { RouteRecordRaw } from "vue-router";
import type { Tab, MenuGroup, MenuList, View } from "@/types/webStyle";
import { IsViewGroup, ViewList } from "@/types/webStyle";

import ProblemList from "@/views/problem/ProblemList.vue";
import ProblemDetail from "@/views/problem/ProblemDetail.vue";
import ProblemRecommend from "@/views/problem/ProblemRecommend.vue";
import JudgeJobList from "@/views/judge/JudgeJobList.vue";
import JudgeJobDetail from "@/views/judge/JudgeJobDetail.vue";
import ContestList from "@/views/contest/ContestList.vue";

import ManageJudge from "@/views/manage/ManageJudge.vue";

const viewsConfig = [
  {
    name: "problem-list",
    tab: "problem",
    sidebar: "problem-list",
    path: "",
    title: "问题列表",
    icon: "cpu",
    component: ProblemList,
  },
  {
    name: "problem-detail",
    tab: "problem",
    sidebar: "problem-list",
    path: ":problemId+",
    title: "问题详情",
    icon: "cpu",
    component: ProblemDetail,
  },
  {
    name: "problem-recommend",
    tab: "problem",
    sidebar: "problem-recommend",
    path: "recommend",
    title: "问题推荐",
    icon: "cpu",
    component: ProblemRecommend,
  },

  {
    name: "judge-list",
    tab: "judge",
    sidebar: "judge-list",
    path: "",
    title: "评测列表",
    icon: "cpu",
    component: JudgeJobList,
  },
  {
    name: "judge-detail",
    tab: "judge",
    sidebar: "judge-list",
    path: ":judgeId+",
    title: "评测详情",
    icon: "cpu",
    component: JudgeJobDetail,
  },

  {
    name: "contest-list",
    tab: "contest",
    sidebar: "contest-list",
    path: "",
    title: "比赛列表",
    icon: "cpu",
    component: ContestList,
  },

  {
    name: "contest-recent",
    tab: "contest",
    sidebar: "contest-recent",
    path: "recent",
    title: "近期比赛",
    icon: "cpu",
    component: ContestList,
  },

  {
    name: "manage-problem",
    tab: "manage",
    path: "problem",
    sidebar: "manage-problem",
    title: "问题管理",
    icon: "cpu",
    auths: ["i-manage-problem"],
    component: ProblemList,
  },

  {
    name: "manage-judge",
    tab: "manage",
    path: "judge",
    sidebar: "manage-judge",
    title: "评测管理",
    icon: "cpu",
    auths: ["i-manage-judge"],
    component: ManageJudge,
  },
] as ViewList;

export const parseTabMenu = (list: MenuList, tabName: string, view: View) => {
  if (view.tab != tabName) {
    return;
  }
  if (view.disableSidebar) {
    return;
  }
  if (view.sidebar == null || view.sidebar != view.name) {
    return;
  }
  list.push({
    name: view.name,
    title: view.title,
    icon: view.icon,
    to: { name: view.name },
  });
};

export const getTabSubMenus = (tabName: string) => {
  const menus = [] as MenuList;
  viewsConfig.forEach((view) => {
    if (IsViewGroup(view)) {
      const views = [] as MenuList;
      view.children.forEach((childView) => {
        parseTabMenu(views, tabName, childView);
      });
      if (views.length > 0) {
        menus.push({
          title: view.title,
          children: views,
        } as MenuGroup);
      }
    } else {
      parseTabMenu(menus, tabName, view);
    }
  });
  return menus;
};

export const parseViewRouter = (routers: RouteRecordRaw[], view: View) => {
  const tabConfig = getTabConfig(view.tab) as Tab;

  const router: RouteRecordRaw = {
    name: view.name,
    path: "/" + view.path,
    meta: {
      title: view.title + " - " + tabConfig.title,
      tab: view.tab,
      sidebar: view.sidebar,
      showSidebar: tabConfig.showSidebar,
      needLogin: tabConfig.needLogin || view.needLogin,
      tabAuths: tabConfig.auths,
      auths: view.auths,
    },
    component: view.component,
  };

  if (!tabConfig.disablePath) {
    router.path = tabConfig.path + router.path;
  }

  routers.push(router);
};

export const makeViewRouter = (routers: RouteRecordRaw[]) => {
  viewsConfig.forEach((view) => {
    if (IsViewGroup(view)) {
      view.children.forEach((childView) => {
        parseViewRouter(routers, childView);
      });
    } else {
      parseViewRouter(routers, view);
    }
  });
};
