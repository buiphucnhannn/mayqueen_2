import { verifyAccessToken } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ACCESS_COOKIE } from "../utils/auth-cookies.js";

/** Bắt buộc đã đăng nhập: đọc access token từ cookie HttpOnly → req.user */
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next(ApiError.unauthorized("Bạn chưa đăng nhập", "UNAUTHENTICATED"));
  const payload = verifyAccessToken(token);
  if (!payload) return next(ApiError.unauthorized("Phiên đăng nhập đã hết hạn", "TOKEN_EXPIRED"));
  req.user = { id: payload.sub, role: payload.role };
  next();
}

/** Bắt buộc có 1 trong các vai trò (dùng sau requireAuth) */
export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(ApiError.forbidden("Bạn không có quyền thực hiện thao tác này"));

/** Dùng cho mọi route quản trị */
export const requireAdmin = [requireAuth, requireRole("admin")];
