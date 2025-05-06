import { defineStore } from "pinia";
import type { UserState } from "@/types/user";
import { isRolesHasAllAuths } from "@/auth";

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: "",
    userId: -1,
    username: "",
    nickname: "",
    roles: [],
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
        roles: [],
      });
    },
    loadResponse(response: any) {
      this.$patch({
        token: response.token,
        userId: response.user_id,
        username: response.username,
        nickname: response.nickname,
        roles: response.roles,
      });
    },
    isLogin(): boolean {
      return this.token != null && this.token != "";
    },
    hasAllAuths(auths: string[]): boolean {
      if (!auths) {
        return true;
      }
      return isRolesHasAllAuths(this.roles, auths);
    },
  },
  persist: true,
});
