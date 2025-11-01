import md5 from "md5";

const GetCravatarUrl = (email: string) => {
  return `https://cravatar.cn/avatar/${md5(email.toLowerCase().trim())}?d=identicon&s=100`;
};

export const GetAvatarUrl = (username: string, email: string) => {
  if (email) {
    return GetCravatarUrl(email);
  } else {
    return GetCravatarUrl(username + "@avatar.com");
  }
};
