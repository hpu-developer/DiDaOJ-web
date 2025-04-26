import type { MenuList } from "@/types/webStyle";

export interface SidebarStyleState {
  showSidebar: boolean;
  forceHiddenSidebar: boolean;
  menuActiveName: string;
  menuList: MenuList;
}
