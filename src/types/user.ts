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
  accepted: number;
  attempt: number;
  avatar: string;
  vjudgeId: string;
}

export interface UserModifyInfo {
  nickname: string;
  slogan: string;
  email: string;
  organization: string;
  vjudge_id: string;
}

export interface UserModifyInfoRequest {
  nickname?: string;
  slogan?: string;
  organization: string;
}

export interface UserModifyVjudgeRequest {
  username?: string;
}
