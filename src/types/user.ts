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
