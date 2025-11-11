export interface UserState {
  token: string;
  userId: number;
  username: string;
  nickname: string;
  roles: string[];
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  slogan: string;
  email: string;
  organization: string;
  gender: number;
  blog: string;
  accept: number;
  attempt: number;
  vjudge_id: string;
}

export interface UserInfoView {
  id: number;
  username: string;
  nickname: string;
  slogan: string;
  email: string;
  organization: string;
  gender: number;
  blog: string;
  blogUrl: string;
  accept: number;
  attempt: number;
  avatar: string;
  vjudgeId: string;
}

export interface UserModifyInfo {
  nickname: string;
  slogan: string;
  email: string;
  organization: string;
  real_name: string;
  gender: number;
  blog: string;
  vjudge_id: string;
}

export interface UserModifyInfoRequest {
  nickname?: string;
  slogan?: string;
  gender: string;
  real_name?: string;
  organization: string;
  blog: string;
}

export interface UserModifyPasswordRequest {
  password: string;
  new_password: string;
}

export interface UserModifyEmailRequest {
  email_key: string;
}

export interface UserModifyVjudgeRequest {
  approved: boolean;
  username?: string;
}
