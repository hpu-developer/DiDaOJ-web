import { defineStore } from "pinia";
import type { WebStyleState } from "@/types/webStyle";

export const useWebStyleStore = defineStore("webStyle", {
  state: (): WebStyleState => ({
    title: "",
  }),
  actions: {
    setTitle(title: string) {
      this.title = title;
    },
  },
});
