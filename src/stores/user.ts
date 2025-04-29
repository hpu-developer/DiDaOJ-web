import { defineStore } from "pinia";
import type { UserState } from "@/types/user";

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: "",
    userId: -1,
    username: "",
    nickname: "",
  }),
  getters: {
    getToken(): string {
      return this.token;
    },
    getUserId(): number {
      return this.userId;
    },
    getUsername(): string {
      return this.username;
    },
    getNickname(): string {
      return this.nickname;
    },
  },
  actions: {
    clear() {
      this.$patch({
        token: "",
        userId: -1,
        username: "",
        nickname: "",
      });
    },
    loadResponse(response: any) {
      this.$patch({
        token: response.token,
        userId: response.user_id,
        username: response.username,
        nickname: response.nickname,
      });
    },
    isLogin(): boolean {
      return this.token != null && this.token != "";
    },
  },
  persist: true,
});
