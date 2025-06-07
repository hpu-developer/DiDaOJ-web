import type { Router } from "vue-router";
import router from "@/router";

export const handleGotoUsername = async (router: Router, username: string) => {
  if (!username) {
    return;
  }
  await router.push({ name: "user", params: { username: username } });
};

export const handleGotoProblem = async (problemId: string) => {
  await router.push({
    name: "problem-detail",
    params: { problemId: problemId },
  });
};

export const handleGotoContestProblem = async (contestId: number, problemIndex: string) => {
  await router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: problemIndex } });
};
