import pino from "pino";
import { env } from "./env.js";

/**
 * Logger dùng chung (pino).
 * - Production: JSON 1 dòng / sự kiện (Render, Datadog, Logtail... lọc theo trường được) + giờ ISO.
 * - Local: pino-pretty, 1 dòng dễ đọc: "GET /api/v1/products 200 - 92ms".
 * - Bảo mật: KHÔNG ghi header / cookie / body; các khóa nhạy cảm còn sót (token, mật khẩu...) bị che
 *   "[REDACTED]" ở mọi cấp → lỡ log nhầm object cũng không lộ.
 * LOG_LEVEL=debug | info (mặc định) | warn | error
 */
const SENSITIVE = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiSecret",
  "authorization",
  "cookie",
  "set-cookie",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: env.isProd ? { service: "mayqueen-api", env: env.nodeEnv } : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) }, // "level":"warn" thay vì 40 — dễ lọc
  redact: {
    paths: [
      ...SENSITIVE,
      ...SENSITIVE.map((k) => `*.${k}`),
      ...SENSITIVE.map((k) => `*.*.${k}`),
      'req.headers["x-api-key"]',
    ],
    censor: "[REDACTED]",
  },
  ...(env.isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            singleLine: true,
            // request log: đã gói đủ vào dòng chữ → ẩn các trường lặp lại cho gọn
            ignore: "pid,hostname,req,res,responseTime,reqId",
          },
        },
      }),
});

/**
 * Nhật ký bảo mật / thao tác quản trị — luôn có trường `event` để lọc:
 *   audit(req, "product.update", { id, slug })
 *   → {"event":"product.update","actor":"admin","ip":"1.2.3.4","reqId":"…","id":"…","slug":"…"}
 */
export function audit(req, event, data = {}, level = "info") {
  (req.log ?? logger)[level](
    { event, ...(req.user?.id && { actor: req.user.id }), ip: req.ip, ...data },
    `[${event}]${data.slug ? ` ${data.slug}` : data.code ? ` ${data.code}` : ""}`,
  );
}
