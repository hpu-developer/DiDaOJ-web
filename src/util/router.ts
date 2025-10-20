import type { Router } from "vue-router";
import router from "@/router";

export const handleGotoLogin = async (router: Router, redirectUri: string | null) => {
  if (redirectUri) {
    await router.push({ name: "login", query: { redirect_uri: redirectUri } });
  }
  else {
    await router.push({ name: "login" });
  }
}

export const handleGotoUsername = async (router: Router, username: string | undefined) => {
  if (!username) {
    return;
  }
  await router.push({ name: "user", params: { username: username } });
};

export const handleOpenUsername = async (router: Router, username: string | undefined) => {
  if (!username) {
    return;
  }
  const routeData = router.resolve({ name: "user", params: { username: username } });
  window.open(routeData.href, "_blank");
};

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

export const handleGotoContestProblem = async (contestId: number, problemIndex: string) => {
  await router.push({ name: "contest-problem-detail", params: { contestId: contestId, problemIndex: problemIndex } });
};
