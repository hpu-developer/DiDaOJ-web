export interface DeveloperState {
  token: string;
  openId: string;
  name: string;
  avatar: string;
}

export enum SvnLockNotifyType {
  Normal = 0,
  Always,
  Close,
}

export enum SilentType {
  Open = 0,
  Close,
  NeedNot,
}

export interface DeveloperConfig {
  tapd: string;
  svn: string;
  git: string;
  svnLockNotifyType: SvnLockNotifyType;
  svnUnlockNotifyType: SvnLockNotifyType;
  tapdOperateSilent: SilentType;
  tapdListenSilent: SilentType;
  svnOperateSilent: SilentType;
  svnListenSilent: SilentType;
}
