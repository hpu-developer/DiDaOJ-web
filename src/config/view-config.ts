import { getTabConfig } from "./tab-config";

import type { RouteRecordRaw } from "vue-router";
import type { Tab, MenuGroup, MenuList, View } from "@/types/webStyle";
import { IsViewGroup, ViewList } from "@/types/webStyle";

const viewsConfig = [
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
