import { defineStore } from "pinia";
import type { Menu, MenuGroup, MenuList } from "@/types/webStyle";
import type { SidebarStyleState } from "@/types/sidebarStyle";

export const useSidebarStyleStore = defineStore("sidebarStyle", {
  state: (): SidebarStyleState => ({
    showSidebar: false,
    forceHiddenSidebar: false,
    menuActiveName: "",
    menuList: [],
  }),
  getters: {
    getMenuList(): MenuList {
      return this.menuList;
    },
  },
  actions: {
    setSidebarShow(show: boolean) {
      this.showSidebar = show;
    },
    setForceHiddenSidebar(forceHidden: boolean) {
      this.forceHiddenSidebar = forceHidden;
    },
    setMenuActiveName(name: string) {
      this.menuActiveName = name;
    },
    clearMenuList() {
      this.menuList = [];
    },
    setMenuList(menuList: MenuList) {
      this.menuList = menuList;
    },
    addMenuList(menu: Menu | MenuGroup) {
      this.menuList.push(menu);
    },
  },
});
