import { env } from "../config/env.js";
import { audit } from "../config/logger.js";
import { authService } from "../services/auth.service.js";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../utils/auth-cookies.js";
import { ok } from "../utils/response.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });

/** Chỉ chấp nhận đường dẫn nội bộ (chặn open redirect: //evil.com, \evil.com, https://...) */
const safeNext = (raw) => {
  const next = String(raw ?? "/admin");
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/admin";
};

/** Token chỉ nằm trong cookie HttpOnly — KHÔNG bao giờ trả trong body */
export const authController = {
  async login(req, res) {
    let session;
    try {
      session = await authService.login(req.validated.body, meta(req));
    } catch (err) {
      // không ghi tên đăng nhập đã gõ (có thể là mật khẩu gõ nhầm ô)
      if (err.code === "INVALID_CREDENTIALS") audit(req, "auth.login_failed", {}, "warn");
      throw err;
    }
    const { user, accessToken, refreshToken, remember } = session;
    req.user = user;
    audit(req, "auth.login", { userAgent: req.get("user-agent") });
    setAuthCookies(res, { accessToken, refreshToken, remember });
    ok(res, { user });
  },

  /** Trang đăng nhập hỏi: có hiện nút "Đăng nhập nhanh (demo)" không */
  demoStatus(_req, res) {
    ok(res, { enabled: env.demoLogin });
  },

  /** Đăng nhập nhanh (demo) — DEMO_LOGIN=true mới dùng được (tắt → 404) */
  async demoLogin(req, res) {
    const { user, accessToken, refreshToken, remember } = await authService.demoLogin(meta(req));
    req.user = user;
    audit(req, "auth.login_demo", { userAgent: req.get("user-agent") }, "warn"); // để thấy rõ trong log
    setAuthCookies(res, { accessToken, refreshToken, remember });
    ok(res, { user });
  },

  async refresh(req, res) {
    try {
      const session = await authService.refresh(req.cookies?.[REFRESH_COOKIE], meta(req));
      setAuthCookies(res, session);
      ok(res, { user: session.user });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  },

  /** GET — proxy Next.js điều hướng trình duyệt tới đây khi access hết hạn, làm mới xong quay lại trang cũ */
  async resume(req, res) {
    try {
      setAuthCookies(res, await authService.refresh(req.cookies?.[REFRESH_COOKIE], meta(req)));
    } catch {
      clearAuthCookies(res);
    }
    res.redirect(303, safeNext(req.query.next));
  },

  async logout(req, res) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    audit(req, "auth.logout");
    clearAuthCookies(res);
    res.status(204).end();
  },

  async me(req, res) {
    ok(res, { user: await authService.me(req.user.id) });
  },
};
