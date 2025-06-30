import type { Router } from "vue-router";
import router from "@/router";

export const handleGotoUsername = async (router: Router, username: string | undefined) => {
  if (!username) {
    return;
  }
  await router.push({ name: "user", params: { username: username } });
};

export const handleOpenProblem = (problemId: string) => {
  const routeData = router.resolve({
    name: "problem-detail",
    params: { problemId }
  });
  window.open(routeData.href, '_blank');
};

export const handleGotoProblem = async (problemKey: string) => {
  await router.push({
    name: "problem-detail",
    params: { problemKey: problemKey },
  });
};

export const handleGotoContestProblem = async (contestId: number, problemIndex: string) => {
  await router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: problemIndex } });
};
