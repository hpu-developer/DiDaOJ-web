import { defineStore } from "pinia";

export const useLoginStore = defineStore("login", {
  state: () => ({
    Loaded: false,
  }),
  getters: {
    isLoaded(): boolean {
      return this.Loaded;
    },
  },
});
