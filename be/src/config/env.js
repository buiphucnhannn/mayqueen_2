import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { z } from "zod";

// Hosting cPanel (Setup Node.js App / Passenger) chạy thẳng `node src/server.js`, không qua `npm start`
// → tự nạp .env ở thư mục app nếu có (biến đã đặt sẵn trong môi trường không bị ghi đè).
if (existsSync(".env")) process.loadEnvFile(".env");

/**
 * Đọc + kiểm tra biến môi trường MỘT LẦN khi khởi động.
 * Thiếu / sai biến bắt buộc → dừng app ngay với thông báo rõ ràng (thay vì lỗi mơ hồ lúc chạy).
 * File .env được nạp bởi cờ `node --env-file-if-exists=.env` trong package.json.
 */
const csv = z
  .string()
  .default("")
  .transform((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGINS: csv,
    // Số proxy tin cậy phía trước (Next.js rewrite = 1) → req.ip đúng IP thật, không giả được X-Forwarded-For
    TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
    // Mã bí mật chung với frontend (Vercel đặt cùng giá trị). Có → chỉ nhận request mang header
    // X-Proxy-Secret khớp (chặn gọi thẳng *.onrender.com để giả X-Forwarded-For né giới hạn). Trống → tắt.
    PROXY_SECRET: z.string().trim().default(""),

    // ----- Email thông báo cho admin (Resend — gửi qua HTTPS, chạy được cả trên Render gói Free) -----
    RESEND_API_KEY: z.string().trim().default(""), // trống → tắt gửi mail (không lỗi)
    MAIL_FROM: z.string().trim().default("Mayqueen Slim <onboarding@resend.dev>"),
    ADMIN_NOTIFY_EMAILS: csv, // người nhận, cách nhau dấu phẩy
    PUBLIC_SITE_URL: z.string().trim().default(""), // link website trong email (nút "Mở trong trang quản trị")
    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),

    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    MONGODB_DB_NAME: z.string().min(1).default("mayqueen"),

    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),
    CLOUDINARY_FOLDER: z.string().default("mayqueen"),

    // ----- Đăng nhập quản trị -----
    JWT_ACCESS_SECRET: z.string().default(""),
    JWT_REFRESH_SECRET: z.string().default(""),
    JWT_ACCESS_TTL: z.string().default("15m"),
    JWT_REFRESH_TTL: z.string().default("7d"),
    MAX_SESSIONS: z.coerce.number().int().positive().default(10), // 2 tên miền × vài thiết bị
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    ADMIN_ID: z.string().trim().default(""),
    ADMIN_PASSWORD: z.string().default(""),
    ADMIN_NAME: z.string().trim().default("Quản trị viên"),

    FREE_SHIP_THRESHOLD: z.coerce.number().int().nonnegative().default(500000),
    SHIPPING_FEE: z.coerce.number().int().nonnegative().default(30000),
  })
  .superRefine((e, ctx) => {
    if (e.NODE_ENV !== "production") return;
    const need = (cond, path, message) =>
      !cond && ctx.addIssue({ code: "custom", path: [path], message });
    need(
      e.JWT_ACCESS_SECRET.length >= 32,
      "JWT_ACCESS_SECRET",
      "must be >= 32 chars in production",
    );
    need(
      e.JWT_REFRESH_SECRET.length >= 32,
      "JWT_REFRESH_SECRET",
      "must be >= 32 chars in production",
    );
    need(
      e.JWT_ACCESS_SECRET !== e.JWT_REFRESH_SECRET,
      "JWT_REFRESH_SECRET",
      "must differ from JWT_ACCESS_SECRET",
    );
    need(e.ADMIN_ID, "ADMIN_ID", "is required in production");
    need(e.ADMIN_PASSWORD.length >= 12, "ADMIN_PASSWORD", "must be >= 12 chars in production");
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
  console.error(`[env] Invalid environment variables (see be/.env.example):\n${lines.join("\n")}`);
  process.exit(1);
}

const e = parsed.data;

// Dev chưa đặt secret → tạo ngẫu nhiên mỗi lần chạy (khởi động lại = phải đăng nhập lại)
const devSecret = () => randomBytes(48).toString("base64url");

export const env = Object.freeze({
  nodeEnv: e.NODE_ENV,
  isProd: e.NODE_ENV === "production",
  port: e.PORT,
  corsOrigins: e.CORS_ORIGINS,
  trustProxy: e.TRUST_PROXY,
  proxySecret: e.PROXY_SECRET,
  rateLimit: { windowMs: e.RATE_LIMIT_WINDOW_MS, max: e.RATE_LIMIT_MAX },
  mongo: { uri: e.MONGODB_URI, dbName: e.MONGODB_DB_NAME },
  cloudinary: {
    cloudName: e.CLOUDINARY_CLOUD_NAME,
    apiKey: e.CLOUDINARY_API_KEY,
    apiSecret: e.CLOUDINARY_API_SECRET,
    folder: e.CLOUDINARY_FOLDER,
    enabled: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
  },
  jwt: {
    accessSecret: e.JWT_ACCESS_SECRET || devSecret(),
    refreshSecret: e.JWT_REFRESH_SECRET || devSecret(),
    accessTtl: e.JWT_ACCESS_TTL,
    refreshTtl: e.JWT_REFRESH_TTL,
  },
  maxSessions: e.MAX_SESSIONS,
  cookieSecure: e.COOKIE_SECURE ? e.COOKIE_SECURE === "true" : e.NODE_ENV === "production",
  admin: { id: e.ADMIN_ID, password: e.ADMIN_PASSWORD, name: e.ADMIN_NAME },
  order: { freeShipThreshold: e.FREE_SHIP_THRESHOLD, shippingFee: e.SHIPPING_FEE },
  mail: {
    resendKey: e.RESEND_API_KEY,
    from: e.MAIL_FROM,
    to: e.ADMIN_NOTIFY_EMAILS,
    // link trong email: ưu tiên PUBLIC_SITE_URL, không có thì lấy origin đầu tiên của CORS_ORIGINS
    // CHỈ nhận link https công khai: link http / localhost trong email là dấu hiệu spam (Gmail) và người nhận
    // cũng không mở được → khi chạy local tự dùng địa chỉ website thật.
    siteUrl: [e.PUBLIC_SITE_URL, e.CORS_ORIGINS[0], "https://mayqueen-slim.vercel.app"]
      .map((u) => (u || "").replace(/\/+$/, ""))
      .find((u) => /^https:\/\/(?!localhost|127\.)/.test(u)),
    enabled: Boolean(e.RESEND_API_KEY && e.ADMIN_NOTIFY_EMAILS.length),
  },
});
