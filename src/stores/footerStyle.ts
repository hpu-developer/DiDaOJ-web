import { defineStore } from "pinia";
import type { FooterStyleState } from "@/types/footerStyle";

export const useFooterStyleStore = defineStore("footerStyle", {
  state: (): FooterStyleState => ({
    showFooter: true,
    forceHiddenFooter: false,
  }),
  actions: {
    setFooterShow(show: boolean) {
      this.showFooter = show;
    },
    setForceHiddenFooter(forceHidden: boolean) {
      this.forceHiddenFooter = forceHidden;
    },
  },
});