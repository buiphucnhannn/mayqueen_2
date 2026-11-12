import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { audit } from "../config/logger.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const SECRET_HEADER = "x-proxy-secret";
const CLIENT_IP_HEADER = "x-client-ip";
const secret = Buffer.from(env.proxySecret);

const matches = (value) => {
  const got = Buffer.from(value ?? "");
  return got.length === secret.length && timingSafeEqual(got, secret);
};

/**
 * "Khóa cửa sau" + IP khách không giả được.
 *
 * 1) Backend chỉ nhận request API đi qua website: frontend (Next.js trên Vercel) gắn header X-Proxy-Secret.
 *    Ai gọi thẳng *.onrender.com/api/... → 403. Đường dẫn ngoài /api (Render tự gõ "/" kiểm tra lúc deploy)
 *    cho qua → 404 bình thường, không ghi cảnh báo thừa. /api/v1/health luôn mở cho Render kiểm tra.
 *
 * 2) IP khách: KHÔNG tin X-Forwarded-For (Vercel giữ nguyên giá trị khách tự gửi → giả được). Frontend lấy IP
 *    thật từ x-real-ip (Vercel tự đặt, khách không ghi đè được) rồi gửi qua header X-Client-IP. Backend CHỈ tin
 *    X-Client-IP khi request mang đúng mã bí mật (tức chắc chắn đến từ frontend) → mọi giới hạn tần suất,
 *    log, phiên đăng nhập dùng IP này.
 *
 * PROXY_SECRET trống (máy dev / chưa cấu hình) → tắt cả hai, chạy như cũ (req.ip theo TRUST_PROXY).
 */
export function proxyGuard(req, _res, next) {
  if (!secret.length) return next();
  const trusted = matches(req.get(SECRET_HEADER));

  if (trusted) {
    const ip = (req.get(CLIENT_IP_HEADER) ?? "").trim();
    // ghi đè req.ip (getter của Express) chỉ cho request này
    if (isIP(ip)) Object.defineProperty(req, "ip", { value: ip, configurable: true });
    return next();
  }
  if (!req.path.startsWith("/api/") || req.path === "/api/v1/health") return next();
  audit(req, "security.direct_access", { path: req.path }, "warn");
  next(ApiError.forbidden("Forbidden", "DIRECT_ACCESS"));
}
