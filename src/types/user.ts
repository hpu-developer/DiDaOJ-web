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
  vjudge_id: string;
}

export interface UserModifyInfoRequest {
  nickname?: string;
  slogan?: string;
  organization: string;
}

export interface UserModifyVjudgeRequest {
  approved: boolean;
  username?: string;
}
