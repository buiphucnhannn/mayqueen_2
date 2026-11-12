import { env } from "../config/env.js";
import { toMs } from "./duration.js";

/**
 * Cookie đăng nhập — HttpOnly (JS trình duyệt không đọc được), SameSite=Strict (chống CSRF),
 * Secure + tiền tố __Host-/__Secure- ở production. Không đặt domain → cookie chỉ thuộc đúng host
 * (frontend gọi API qua rewrite cùng origin của Next.js).
 */
const secure = env.cookieSecure;
const REFRESH_TTL_MS = toMs(env.jwt.refreshTtl);

export const ACCESS_COOKIE = secure ? "__Host-mq_at" : "mq_at";
export const REFRESH_COOKIE = secure ? "__Secure-mq_rt" : "mq_rt";
/** Cookie "gợi ý" (giá trị "1") để proxy Next biết có thể còn phiên → thử làm mới thay vì báo 403 */
export const SESSION_HINT_COOKIE = secure ? "__Host-mq_session" : "mq_session";
export const REFRESH_PATH = "/api/v1/auth"; // refresh token chỉ gửi tới các route /auth

const base = { httpOnly: true, secure, sameSite: "strict" };

/**
 * remember = "Ghi nhớ đăng nhập": cookie có hạn (giữ qua các lần tắt trình duyệt).
 * Không ghi nhớ: cookie phiên (không maxAge) → trình duyệt tự xóa khi đóng.
 */
export function setAuthCookies(res, { accessToken, refreshToken, remember = true }) {
  const life = remember ? { maxAge: REFRESH_TTL_MS } : {};
  // Cookie access sống bằng refresh: JWT hết hạn vẫn được gửi lên → backend trả TOKEN_EXPIRED (làm mới được)
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, path: "/", ...life });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, path: REFRESH_PATH, ...life });
  res.cookie(SESSION_HINT_COOKIE, "1", { ...base, path: "/", ...life });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_PATH });
  res.clearCookie(SESSION_HINT_COOKIE, { ...base, path: "/" });
}
