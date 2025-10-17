import md5 from "md5";
export const GetAvatarUrl = (email: string) => {
  return `https://cravatar.cn/avatar/${md5(email.toLowerCase().trim())}?d=identicon&s=100`;
};
