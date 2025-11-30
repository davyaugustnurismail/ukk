import Cookies from "js-cookie";

export function setAuthCookie(token: string) {
  Cookies.set("token", token, { path: "/" });
  document.cookie = `auth_token=${token}; path=/`;
}
