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
}

export interface UserInfoView {
  id: number;
  username: string;
  nickname: string;
  slogan: string;
  email: string;
  organization: string;
}
