import { env } from "../config/env.js";
import { audit } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Origin trùng tên miền mà trình duyệt đang mở (website gọi /api/v1 cùng tên miền → Next/Vercel chuyển tiếp
 * sang backend, giữ tên miền gốc ở X-Forwarded-Host) → hợp lệ, KHÔNG cần khai tên miền deploy vào CORS_ORIGINS.
 * An toàn: trang web lạ gửi Origin của chính nó (khác tên miền site) → vẫn bị chặn.
 */
function sameSite(req, origin) {
  let host;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const forwarded = (req.get("x-forwarded-host") || "").split(",")[0].trim().toLowerCase();
  return host === forwarded || host === (req.get("host") || "").toLowerCase();
}

/**
 * Chống CSRF (lớp thứ 2, bên cạnh cookie SameSite=Strict):
 * mọi request thay đổi dữ liệu phải có header `X-Requested-With: fetch` (form HTML/ảnh ở site khác
 * không gửi được header tùy chỉnh) và nếu có Origin thì phải là chính tên miền website (tự nhận)
 * hoặc thuộc CORS_ORIGINS (chỉ cần khi một tên miền KHÁC gọi thẳng API).
 */
export function originGuard(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  if (req.get("x-requested-with") !== "fetch") {
    audit(req, "security.csrf_rejected", { path: req.path }, "warn");
    return next(ApiError.forbidden("Yêu cầu không hợp lệ", "CSRF_REJECTED"));
  }
  const origin = req.get("origin");
  if (origin && !env.corsOrigins.includes(origin) && !sameSite(req, origin)) {
    audit(req, "security.bad_origin", { origin, path: req.path }, "warn");
    return next(ApiError.forbidden("Nguồn gửi yêu cầu không được phép", "BAD_ORIGIN"));
  }
  next();
}
