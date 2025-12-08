import { getTabConfig } from "./tab-config";

import type { RouteRecordRaw } from "vue-router";
import type { Tab, MenuGroup, MenuList, View } from "@/types/webStyle";
import { IsViewGroup, ViewList } from "@/types/webStyle";

import { AuthType } from "@/auth";

import ProblemList from "@/views/problem/ProblemList.vue";
import ProblemDetail from "@/views/problem/ProblemDetail.vue";
import ProblemStatistics from "@/views/problem/ProblemStatistics.vue";
import ProblemDailyList from "@/views/problem/ProblemDailyList.vue";
import ProblemDailyEdit from "@/views/problem/ProblemDailyEdit.vue";
import ProblemRecommend from "@/views/problem/ProblemRecommend.vue";
import ProblemEdit from "@/views/problem/ProblemEdit.vue";
import ProblemJudge from "@/views/problem/ProblemJudge.vue";

import BotList from "@/views/bot/BotList.vue";
import BotGame from "@/views/bot/BotGame.vue";
import BotGameEdit from "@/views/bot/BotGameEdit.vue";
import BotReplay from "@/views/bot/BotReplay.vue";
import BotReplayList from "@/views/bot/BotReplayList.vue";

import CollectionList from "@/views/collection/CollectionList.vue";
import CollectionDetail from "@/views/collection/CollectionDetail.vue";
import CollectionRank from "@/views/collection/CollectionRank.vue";
import CollectionEdit from "@/views/collection/CollectionEdit.vue";

import JudgeJobList from "@/views/judge/JudgeJobList.vue";
import JudgeJobDetail from "@/views/judge/JudgeJobDetail.vue";

import ContestList from "@/views/contest/ContestList.vue";
import ContestDetail from "@/views/contest/ContestDetail.vue";
import ContestRank from "@/views/contest/ContestRank.vue";
import ContestEdit from "@/views/contest/ContestEdit.vue";
import ContestStatistics from "@/views/contest/ContestStatistics.vue";

import DiscussList from "@/views/discuss/DiscussList.vue";
import DiscussDetail from "@/views/discuss/DiscussDetail.vue";
import DiscussEdit from "@/views/discuss/DiscussEdit.vue";

import RankUser from "@/views/rank/RankUser.vue";
import UserForget from "@/views/user/UserForget.vue";

import SystemStatus from "@/views/system/SystemStatus.vue";

import ManageJudge from "@/views/manage/ManageJudge.vue";
import ManageWeb from "@/views/manage/ManageWeb.vue";
import ContestRencently from "@/views/contest/ContestRencently.vue";

const viewsConfig = [
  {
    name: "problem-list",
    tab: "problem",
    sidebar: "problem-list",
    path: "",
    title: "问题列表",
    icon: "file-1",
    component: ProblemList,
  },
  {
    name: "problem-detail",
    tab: "problem",
    sidebar: "problem-list",
    path: ":problemKey+",
    title: "问题详情",
    icon: "article",
    component: ProblemDetail,
  },
  {
    name: "problem-statistics",
    tab: "problem",
    sidebar: "problem-list",
    path: "statistics/:problemKey*",
    title: "提交统计",
    icon: "chart-bar",
    needLogin: false,
    component: ProblemStatistics,
  },
  {
    name: "problem-daily-list",
    tab: "problem",
    sidebar: "problem-daily-list",
    path: "daily",
    title: "每日一题",
    icon: "calendar-1",
    component: ProblemDailyList,
  },
  {
    name: "problem-daily-detail",
    tab: "problem",
    sidebar: "problem-daily-list",
    path: "daily/:dailyId+",
    title: "问题详情",
    icon: "calendar-event",
    component: ProblemDetail,
  },
  {
    name: "problem-recommend",
    tab: "problem",
    sidebar: "problem-recommend",
    path: "recommend/:problemKey*",
    title: "问题推荐",
    icon: "lightbulb",
    needLogin: true,
    component: ProblemRecommend,
  },
  {
    name: "problem-collection-list",
    tab: "problem",
    sidebar: "problem-collection-list",
    path: "collection",
    title: "题目集合",
    icon: "folder-1",
    disableTabPath: true,
    component: CollectionList,
  },
  {
    name: "collection-detail",
    tab: "collection-detail-tab",
    sidebar: "collection-detail",
    path: ":collectionId+",
    title: "题集详情",
    icon: "folder-details",
    component: CollectionDetail,
  },
  {
    name: "collection-rank",
    tab: "collection-detail-tab",
    sidebar: "collection-rank",
    path: ":collectionId+/rank",
    title: "题集排名",
    icon: "chart-line",
    component: CollectionRank,
  },
  {
    name: "collection-edit",
    tab: "collection-detail-tab",
    sidebar: "collection-edit",
    disableSidebar: true,
    needLogin: true,
    path: ":collectionId+/edit",
    title: "题集编辑",
    icon: "edit",
    component: CollectionEdit,
  },
  {
    name: "collection-create",
    tab: "collection-detail-tab",
    sidebar: "collection-create",
    needLogin: true,
    disableSidebar: true,
    path: "create",
    title: "新建题集",
    icon: "add",
    component: CollectionEdit,
  },

  {
    name: "judge-list",
    tab: "problem",
    sidebar: "judge-list",
    title: "评测列表",
    icon: "cloud",
    path: "judge",
    disableTabPath: true,
    component: JudgeJobList,
  },
  {
    name: "judge-detail",
    tab: "problem",
    sidebar: "judge-list",
    title: "评测详情",
    icon: "check-circle",
    path: "judge/:judgeId+",
    disableTabPath: true,
    component: JudgeJobDetail,
  },

  {
    name: "contest-list",
    tab: "contest",
    sidebar: "contest-list",
    path: "",
    title: "比赛列表",
    icon: "flag",
    component: ContestList,
  },
  {
    name: "contest-recent",
    tab: "contest",
    sidebar: "contest-recent",
    path: "recent",
    title: "近期比赛",
    icon: "time",
    component: ContestRencently,
  },
  {
    name: "contest-create",
    tab: "contest",
    sidebar: "contest-create",
    disableSidebar: true,
    needLogin: true,
    path: "create",
    title: "新建比赛",
    icon: "plus",
    component: ContestEdit,
  },
  {
    name: "contest-edit",
    tab: "contest-detail-tab",
    sidebar: "contest-edit",
    disableSidebar: true,
    needLogin: true,
    path: ":contestId+/edit",
    title: "比赛编辑",
    icon: "edit",
    component: ContestEdit,
  },
  {
    name: "contest-detail",
    tab: "contest-detail-tab",
    sidebar: "contest-detail",
    path: ":contestId+",
    title: "比赛详情",
    icon: "flag-1",
    component: ContestDetail,
  },
  {
    name: "contest-problem-detail",
    tab: "contest-detail-tab",
    sidebar: "contest-problem-detail",
    path: ":contestId+/problem/:problemIndex+",
    title: "问题详情",
    icon: "file-code",
    disableSidebar: true,
    component: ProblemDetail,
  },
  {
    name: "bot-list",
    tab: "bot",
    sidebar: "bot-list",
    path: "",
    title: "游戏列表",
    icon: "flag",
    component: BotList,
  },
  {
    name: "bot-game",
    tab: "bot",
    sidebar: "bot-list",
    path: ":gameKey+",
    title: "游戏详情",
    icon: "play",
    component: BotGame,
  },
  {
    name: "bot-replay-list",
    tab: "bot",
    sidebar: "bot-replay-list",
    path: "replay",
    title: "回放列表",
    icon: "camera",
    component: BotReplayList,
  },
  {
    name: "bot-replay",
    tab: "bot",
    sidebar: "bot-replay-list",
    path: ":gameKey+/replay/:replayId+",
    title: "回放详情",
    icon: "play",
    component: BotReplay,
  },
  {
    name: "manage-bot-game",
    tab: "bot",
    sidebar: "manage-bot-game",
    disableSidebar: true,
    path: "game/:gameKey+",
    title: "游戏编辑",
    icon: "edit",
    component: BotGameEdit,
    auths: [AuthType.ManageBotGame],
  },
  {
    name: "contest-judge",
    tab: "contest-detail-tab",
    sidebar: "contest-judge",
    path: ":contestId+/judge",
    title: "评测列表",
    icon: "cloud",
    component: JudgeJobList,
  },
  {
    name: "contest-judge-detail",
    tab: "contest-detail-tab",
    sidebar: "contest-judge-detail",
    path: ":contestId+/judge/:judgeId+",
    title: "评测详情",
    icon: "check-circle",
    component: JudgeJobDetail,
    disableSidebar: true,
  },
  {
    name: "contest-rank",
    tab: "contest-detail-tab",
    sidebar: "contest-rank",
    path: ":contestId+/rank",
    title: "比赛排名",
    icon: "chart-bar",
    component: ContestRank,
  },
  {
    name: "contest-discuss",
    tab: "contest-detail-tab",
    sidebar: "contest-discuss",
    path: ":contestId+/discuss",
    title: "比赛讨论",
    icon: "chat",
    component: DiscussList,
  },
  {
    name: "contest-discuss-detail",
    tab: "contest-detail-tab",
    sidebar: "contest-discuss",
    path: ":contestId+/discuss/:discussId+",
    title: "讨论详情",
    icon: "chat-bubble",
    component: DiscussDetail,
  },
  {
    name: "contest-statistics",
    tab: "contest-detail-tab",
    sidebar: "contest-statistics",
    path: ":contestId+/statistics",
    title: "提交统计",
    icon: "chart-line",
    component: ContestStatistics,
  },

  {
    name: "discuss-list",
    tab: "discuss",
    sidebar: "discuss-list",
    path: "",
    title: "讨论列表",
    icon: "chat",
    component: DiscussList,
  },
  {
    name: "discuss-create",
    tab: "discuss",
    sidebar: "discuss-create",
    disableSidebar: true,
    needLogin: true,
    path: "create",
    title: "新建讨论",
    icon: "add-circle",
    component: DiscussEdit,
  },
  {
    name: "discuss-edit",
    tab: "discuss-detail-tab",
    sidebar: "discuss-edit",
    disableSidebar: true,
    needLogin: true,
    path: ":discussId+/edit",
    title: "编辑讨论",
    icon: "edit",
    component: DiscussEdit,
  },
  {
    name: "discuss-list-problem",
    tab: "discuss",
    sidebar: "discuss-list-problem",
    path: "problem",
    title: "题目讨论",
    icon: "file",
    component: DiscussList,
  },
  {
    name: "discuss-detail",
    tab: "discuss",
    sidebar: "discuss-list",
    path: ":discussId+",
    title: "讨论详情",
    icon: "chat-bubble",
    component: DiscussDetail,
  },

  {
    name: "rank-ac-all",
    tab: "rank",
    sidebar: "rank-ac-all",
    path: "ac",
    title: "AC排名",
    icon: "chart-bar",
    props: {
      type: "all",
    },
    component: RankUser,
  },
  {
    name: "rank-ac-problem",
    tab: "rank",
    sidebar: "rank-ac-problem",
    path: "ac/problem",
    title: "题量排名",
    icon: "chart-pie",
    props: {
      type: "problem",
    },
    component: RankUser,
  },
  {
    name: "rank-ac-problem-today",
    tab: "rank",
    sidebar: "rank-ac-problem-today",
    path: "ac/problem/today",
    title: "今日题量",
    icon: "brightness",
    props: {
      type: "problem-today",
    },
    component: RankUser,
  },
  {
    name: "rank-ac-problem-day7",
    tab: "rank",
    sidebar: "rank-ac-problem-day7",
    path: "ac/problem/day7",
    title: "7日题量",
    icon: "calendar",
    props: {
      type: "problem-day7",
    },
    component: RankUser,
  },
  {
    name: "rank-ac-problem-day30",
    tab: "rank",
    sidebar: "rank-ac-problem-day30",
    path: "ac/problem/day30",
    title: "30日题量",
    icon: "calendar-2",
    props: {
      type: "problem-day30",
    },
    component: RankUser,
  },
  {
    name: "rank-ac-problem-year",
    tab: "rank",
    sidebar: "rank-ac-problem-year",
    path: "ac/problem/year",
    title: "1年题量",
    icon: "chart-3d",
    props: {
      type: "problem-year",
    },
    component: RankUser,
  },

  {
    name: "system-status",
    tab: "system",
    sidebar: "system-status",
    path: "",
    title: "运行状态",
    icon: "setting",
    component: SystemStatus,
  },

  {
    name: "system-about",
    tab: "system",
    sidebar: "system-about",
    path: "about",
    title: "关于",
    icon: "info-circle",
    props: { discussId: "93" },
    component: DiscussDetail,
  },

  {
    name: "manage-problem-create",
    tab: "manage",
    sidebar: "manage-problem-create",
    disableSidebar: true,
    path: "problem",
    title: "新建问题",
    icon: "file-add",
    component: ProblemEdit,
    auths: [AuthType.ManageProblem],
  },
  {
    name: "manage-problem",
    tab: "manage",
    sidebar: "manage-problem",
    disableSidebar: true,
    path: "problem/:problemKey+",
    title: "问题编辑",
    icon: "edit",
    component: ProblemEdit,
    auths: [AuthType.ManageProblem],
  },
  {
    name: "manage-problem-daily-create",
    tab: "manage",
    sidebar: "manage-problem-daily-create",
    disableSidebar: true,
    path: "problem/daily",
    title: "新建每日一题",
    icon: "add",
    component: ProblemDailyEdit,
    auths: [AuthType.ManageProblemDaily],
  },
  {
    name: "manage-problem-daily",
    tab: "manage",
    sidebar: "manage-problem-daily",
    disableSidebar: true,
    path: "problem/daily/:dailyId+",
    title: "编辑每日一题",
    icon: "calendar-edit",
    component: ProblemDailyEdit,
    auths: [AuthType.ManageProblemDaily],
  },
  {
    name: "manage-problem-judge",
    tab: "manage",
    sidebar: "manage-problem-judge",
    disableSidebar: true,
    path: "problem/:problemKey+/judge",
    title: "评测数据",
    icon: "data",
    component: ProblemJudge,
    auths: [AuthType.ManageProblem],
  },
  {
    name: "manage-web",
    tab: "manage",
    path: "web",
    sidebar: "manage-web",
    title: "站点管理",
    icon: "setting",
    auths: [AuthType.ManageWeb],
    component: ManageWeb,
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

  {
    name: "login-forget",
    tab: "login",
    path: "forget",
    title: "忘记密码",
    component: UserForget,
  },
] as ViewList;

export const parseTabMenu = (list: MenuList, toSidebar: string, tabName: string, view: View) => {
  if (view.tab != tabName) {
    return;
  }
  if (view.disableSidebar && toSidebar != view.sidebar) {
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

export const getTabSubMenus = (toSidebar: string, tabName: string) => {
  const menus = [] as MenuList;
  viewsConfig.forEach((view) => {
    if (IsViewGroup(view)) {
      const views = [] as MenuList;
      view.children.forEach((childView) => {
        parseTabMenu(views, toSidebar, tabName, childView);
      });
      if (views.length > 0) {
        menus.push({
          title: view.title,
          children: views,
        } as MenuGroup);
      }
    } else {
      parseTabMenu(menus, toSidebar, tabName, view);
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
    props: view.props,
    component: view.component,
  };

  if (!tabConfig.disablePath && !view.disableTabPath) {
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
