import type { Router } from "vue-router";
import router from "@/router";

export const handleGotoLogin = async (router: Router, redirectUri: string | null) => {
  if (redirectUri) {
    await router.push({ name: "login", query: { redirect_uri: redirectUri } });
  } else {
    await router.push({ name: "login" });
  }
};

export const handleGotoUsername = async (router: Router, username: string | undefined) => {
  if (!username) {
    return;
  }
  await router.push({ name: "user", params: { username: username } });
};

export const handleGotoJudgeList = async (query?: any, contestId?: number | undefined) => {
  if (contestId && contestId > 0) {
    await router.push({ name: "contest-judge-list", params: { contestId: contestId }, query: query });
  } else {
    await router.push({ name: "judge-list", query: query });
  }
};

export const handleGotoJudgeJob = async (id: string, contestId?: number | undefined) => {
  if (contestId && contestId > 0) {
    await router.push({
      name: "contest-judge-detail",
      params: {
        contestId: contestId,
        judgeId: id,
      },
    });
  } else {
    await router.push({
      name: "judge-detail",
      params: {
        judgeId: id,
      },
    });
  }
};

export const handleOpenUsername = async (router: Router, username: string | undefined) => {
  if (!username) {
    return;
  }
  const routeData = router.resolve({ name: "user", params: { username: username } });
  window.open(routeData.href, "_blank");
};

export const handleGotoProblemList = async (query?: any) => {
  await router.push({ name: "problem-list", query: query });
}

export const handleOpenProblem = (problemKey: string) => {
  const routeData = router.resolve({
    name: "problem-detail",
    params: { problemKey: problemKey },
  });
  window.open(routeData.href, "_blank");
};

export const handleGotoProblem = async (problemKey: string) => {
  await router.push({
    name: "problem-detail",
    params: { problemKey: problemKey },
  });
};

export const handleGotoContestProblem = async (contestId: number, problemIndex: number) => {
  await router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: String(problemIndex) } });
};
