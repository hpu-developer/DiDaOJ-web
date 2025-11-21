export enum AuthType {
  ManageWeb = "i-manage-web",
  ManageJudge = "i-manage-judge",
  ManageBotGame = "i-manage-bot-game",
  ManageProblem = "i-manage-problem",
  ManageProblemDaily = "i-manage-problem-daily",
  ManageContest = "i-manage-contest",
  ManageCollection = "i-manage-collection",
  ManageDiscuss = "i-manage-discuss",
}

const roleAuths: Record<string, string[]> = {
  "r-admin": [
    AuthType.ManageWeb,
    AuthType.ManageJudge,
    AuthType.ManageBotGame,
    AuthType.ManageProblem,
    AuthType.ManageProblemDaily,
    AuthType.ManageContest,
    AuthType.ManageCollection,
    AuthType.ManageDiscuss,
  ],
};

export function getRolesAllAuths(roles: string[] | undefined): string[] {
  if (roles == null) {
    return [];
  }
  const auths: string[] = [];
  for (const role of roles) {
    const roleAuth = roleAuths[role];
    if (roleAuth != null) {
      auths.push(...roleAuth);
    }
  }
  return [...new Set(auths)];
}

export function isRolesHasAllAuths(roles: string[] | undefined, auths: string[] | undefined): boolean {
  if (roles == null || auths == null) {
    return false;
  }
  const allAuths = getRolesAllAuths(roles);
  for (const auth of auths) {
    if (!allAuths.includes(auth)) {
      return false;
    }
  }
  return true;
}

export function mergeAuths(auths1: string[] | undefined, auths2: string[] | undefined): string[] {
  if (auths1 == null && auths2 == null) {
    return [];
  } else if (auths1 == null) {
    return auths2 as string[];
  } else if (auths2 == null) {
    return auths1;
  } else {
    return [...new Set([...auths1, ...auths2])];
  }
}
