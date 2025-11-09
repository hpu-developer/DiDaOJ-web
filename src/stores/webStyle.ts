import { defineStore } from "pinia";
import type { WebStyleState } from "@/types/webStyle";

export const useWebStyleStore = defineStore("webStyle", {
  state: (): WebStyleState => ({
    routeTitle: "",
    title: "",
  }),
  getters: {
    getRouteTitle(): string {
      return this.routeTitle;
    },
    getTitle(): string {
      return this.title;
    },
  },
  actions: {
    setRouteTitle(title: string) {
      this.routeTitle = title;
    },
    setTitle(title: string) {
      this.title = title;
    },
  },
});
