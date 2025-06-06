import { defineStore } from "pinia";
import type { ContestState } from "@/types/contest.ts";

export const useContestStore = defineStore("contest", {
  state: (): ContestState => ({
    starMembers: {},
  }),
  actions: {
    clear() {
      this.$patch({
        starMembers: {},
      });
    },
    addStarMember(contestId: number, userId: number) {
      if (!this.starMembers[contestId]) {
        this.starMembers[contestId] = {};
      }
      this.starMembers[contestId][userId] = true;
    },
    removeStarMember(contestId: number, userId: number) {
      if (this.starMembers[contestId]) {
        delete this.starMembers[contestId][userId];
        // 如果该 contest 下已没有用户，则移除 contestId
        if (Object.keys(this.starMembers[contestId]).length === 0) {
          delete this.starMembers[contestId];
        }
      }
    },
    isStarMember(contestId: number, userId: number): boolean {
      return !!this.starMembers[contestId]?.[userId];
    },
  },
  persist: true,
});
