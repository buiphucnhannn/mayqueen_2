import rateLimit from "express-rate-limit";
import { audit } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Bọc express-rate-limit: trả lỗi JSON chuẩn 429 kèm Retry-After / retryAfter (giây).
 * Riêng GET /auth/resume (trình duyệt điều hướng tới) → chuyển sang trang /429 của frontend.
 * Bộ đếm lưu trong bộ nhớ (đủ cho 1 server; nhiều server → dùng store Redis).
 */
export function limiter({ message = "Bạn thao tác quá nhanh, vui lòng thử lại sau", ...options }) {
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...options,
    handler: (req, res, next, opts) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfter = Math.max(
        1,
        Math.ceil(
          ((resetTime ? resetTime.getTime() : Date.now() + opts.windowMs) - Date.now()) / 1000,
        ),
      );
      res.set("Retry-After", String(retryAfter));
      audit(req, "security.rate_limited", { path: req.path, retryAfter }, "warn");

      if (req.method === "GET" && req.path.endsWith("/resume")) {
        const nextPath = String(req.query.next ?? "/admin");
        return res.redirect(303, `/429?next=${encodeURIComponent(nextPath)}&retry=${retryAfter}`);
      }
      const err = new ApiError(429, message, { code: "TOO_MANY_REQUESTS" });
      err.retryAfter = retryAfter;
      next(err);
    },
  });
}
