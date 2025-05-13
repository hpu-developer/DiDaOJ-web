import { defineStore } from "pinia";
import type { WebStyleState } from "@/types/webStyle";

export const useWebStyleStore = defineStore("webStyle", {
  state: (): WebStyleState => ({
    title: "",
  }),
  getters: {
    getTitle(): string {
      return this.title;
    },
  },
  actions: {
    setTitle(title: string) {
      this.title = title;
    },
  },
});
