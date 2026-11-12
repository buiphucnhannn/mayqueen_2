import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

/**
 * Tài khoản quản trị DUY NHẤT, khai báo trong .env (ADMIN_ID / ADMIN_PASSWORD / ADMIN_NAME).
 * So khớp bằng timingSafeEqual trên SHA-256 (độ dài cố định) → không lộ thông tin qua thời gian phản hồi.
 */
const digest = (value) => createHash("sha256").update(String(value), "utf8").digest();
const same = (a, b) => timingSafeEqual(digest(a), digest(b));

export const adminConfigured = () => Boolean(env.admin.id && env.admin.password);

export const adminUser = () => ({
  id: env.admin.id,
  username: env.admin.id,
  name: env.admin.name,
  role: "admin",
});

export function checkAdminCredentials(username, password) {
  if (!adminConfigured()) return false;
  // Luôn so sánh CẢ HAI (không thoát sớm) → thời gian như nhau dù sai tên hay sai mật khẩu
  const idOk = same(username, env.admin.id);
  const pwOk = same(password, env.admin.password);
  return idOk && pwOk;
}

/**
 * "Dấu vân tay" của tài khoản: đổi ADMIN_ID / ADMIN_PASSWORD trong .env → mọi token & phiên cũ mất hiệu lực.
 */
export const credentialFingerprint = () =>
  createHmac("sha256", env.jwt.accessSecret)
    .update(`${env.admin.id}\u0000${env.admin.password}`)
    .digest("hex")
    .slice(0, 24);
