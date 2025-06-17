import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user.ts";
import { useWebStyleStore } from "@/stores/webStyle";
import { useSidebarStyleStore } from "@/stores/sidebarStyle";
import { makeTabRouter } from "@/config/tab-config";
import { makeViewRouter, getTabSubMenus } from "@/config/view-config";

import type { RouteRecordRaw } from "vue-router";
import View404 from "@/views/View404.vue";
import View403 from "@/views/View403.vue";

const routers = [] as RouteRecordRaw[];

makeTabRouter(routers);
makeViewRouter(routers);

routers.push({
  path: "/403",
  name: "403",
  component: View403,
});

routers.push({
  path: "/:pathMatch(.*)*",
  name: "404",
  component: View404,
});

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routers,
});

router.beforeEach((to, _, next) => {
  if (to.name == null || !router.hasRoute(to.name)) {
    next({ name: "home" });
    return;
  }

  const toMeta = to.matched[to.matched.length - 1].meta;
  if (toMeta.redirect) {
    next({ name: toMeta.redirect as string });
    return;
  }

  if (toMeta.needLogin) {
    const userStore = useUserStore();
    if (userStore.getToken == null || userStore.getToken == "") {
      next({ name: "login", query: { redirect_uri: to.fullPath } });
      return;
    }
  }

  const auths = toMeta.tabAuths as string[] | undefined;
  if (auths) {
    const userStore = useUserStore();
    if (!userStore.hasAllAuths(auths)) {
      next({ name: "403", query: { target: to.fullPath } });
      return;
    }
  }

  next();
});

router.afterEach((to: any, from: any) => {
  if (to.name === from.name) {
    return;
  }

  const sidebarStyleStore = useSidebarStyleStore();
  const webStyleStore = useWebStyleStore();

  let toMeta = null;
  if (to.matched.length > 0) {
    toMeta = to.matched[to.matched.length - 1].meta;
  }
  // let fromMeta = null;
  // if (from.matched.length > 0) {
  //   fromMeta = from.matched[from.matched.length - 1].meta;
  // }

  if (toMeta?.title) {
    webStyleStore.setTitle(toMeta?.title as string);
  }

  if (toMeta?.showSidebar) {
    sidebarStyleStore.setSidebarShow(true);
    const menus = getTabSubMenus(toMeta?.sidebar, toMeta?.tab as string);
    sidebarStyleStore.setMenuList(menus);
    sidebarStyleStore.setMenuActiveName(toMeta?.sidebar as string);
  } else {
    sidebarStyleStore.setSidebarShow(false);
  }
  window.scrollTo(0, 0);
});

export default router;
