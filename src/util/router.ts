import type { Router } from "vue-router";

export const handleGotoUsername = async (router: Router, username: string) => {
  if (!username) {
    return;
  }
  await router.push({ name: "user", params: { username: username } });
};
