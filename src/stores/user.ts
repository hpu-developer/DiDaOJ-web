import { defineStore } from "pinia";
import type { UserState } from "@/types/user.ts";
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
        userId: response.id,
        username: response.username,
        nickname: response.nickname,
        roles: response.roles,
      });
    },
    setNickname(nickname: string) {
      this.nickname = nickname;
    },
    isLogin(): boolean {
      return this.token != null && this.token != "";
    },
    hasAuth(auths: string): boolean {
      return this.hasAllAuths([auths]);
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
