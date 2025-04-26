import { defineStore } from "pinia";
import type { DeveloperState } from "@/types/developer";

export const useDeveloperStore = defineStore("developer", {
  state: (): DeveloperState => ({
    token: "",
    openId: "",
    name: "",
    avatar: "",
  }),
  getters: {
    getToken(): string {
      return this.token;
    },
    getOpenId(): string {
      return this.openId;
    },
    getName(): string {
      return this.name;
    },
    getAvatar(): string {
      return this.avatar;
    },
  },
  actions: {
    clear() {
      this.$patch({
        token: "",
        openId: "",
        name: "",
        avatar: "",
      });
    },
    loadResponse(response: any) {
      this.$patch({
        openId: response.open_id,
        name: response.name,
        avatar: response.avatar,
      });
    },
    isLogin(): boolean {
      return this.token != null && this.token != "";
    },
  },
  persist: true,
});
