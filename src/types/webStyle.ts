import { DefineComponent } from "vue";
import type { RouteLocationRaw } from "vue-router";

export interface WebStyleState {
  title: string;
}

export type Tab = {
  name: string;
  path?: string;
  title: string;
  icon?: string;
  showSidebar: boolean;
  disablePath?: boolean;
  disableGenerateTab?: boolean;
  redirect?: string;
  needLogin?: boolean;
  component?: any;
};

export type View = {
  name: string;
  tab: string;
  sidebar: string;
  path: string;
  title: string;
  icon: string;
  disableSidebar?: boolean;
  needLogin?: boolean;
  component: DefineComponent<unknown, unknown, unknown>;
};

export type ViewGroup = {
  title: string;
  children: View[];
};

export type ViewList = (View | ViewGroup)[];

export type MenuGroup = {
  title: string;
  children: Menu[];
};

export type Menu = {
  name: string;
  title: string;
  icon?: string;
  iconClass?: string;
  to?: RouteLocationRaw;
  children?: Menu[];
};

export type MenuList = (Menu | MenuGroup)[];

export function IsViewGroup(item: View | ViewGroup): item is ViewGroup {
  return (item as ViewGroup).children !== undefined;
}

export function IsMenuGroup(item: Menu | MenuGroup): item is MenuGroup {
  return (item as MenuGroup).children !== undefined;
}
