/**
 * Địa chỉ dùng chung — KHÔNG trỏ cứng localhost ở production.
 * (.mjs thuần, không alias "@/" → next.config.mjs import được)
 */

const trim = (u) => u.replace(/\/+$/, "");
const withProtocol = (host) => (/^https?:\/\//.test(host) ? host : `https://${host}`);
const isLocal = (u) => /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u);

/**
 * URL công khai của website (SEO: canonical, sitemap, robots, Open Graph, JSON-LD).
 * Tự nhận theo nơi deploy, KHÔNG cần đặt biến môi trường:
 *  1. NEXT_PUBLIC_SITE_URL — chỉ khi cố ý đặt (và không phải localhost)
 *  2. Vercel: tên miền production của dự án (tên miền riêng nếu đã gắn, không thì *.vercel.app)
 *     → biến hệ thống Vercel tự cấp; bản NEXT_PUBLIC_ dùng được cả ở trình duyệt
 *  3. Vercel preview: URL của bản deploy đó
 *  4. Render / Netlify: URL ngoài do nền tảng tự cấp
 *  5. Máy dev: http://localhost:<PORT>
 */
// Đọc process.env.TÊN trực tiếp (không gán process.env vào biến): Next chỉ chèn sẵn giá trị NEXT_PUBLIC_*
// vào code trình duyệt khi viết đúng dạng này.
export function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
  const onPlatform = vercelEnv || process.env.RENDER || process.env.NETLIFY;
  if (explicit && !(onPlatform && isLocal(explicit))) return trim(withProtocol(explicit));

  const prod =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const deploy = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  // bản preview giữ URL riêng của nó; production dùng tên miền chính
  const vercel = vercelEnv === "preview" ? deploy || prod : prod || deploy;
  const host = vercel || process.env.RENDER_EXTERNAL_URL || process.env.URL;
  if (host) return trim(withProtocol(host));

  return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Backend (thư mục be/) — CHỈ server Next.js gọi (trình duyệt luôn gọi /api/v1 cùng tên miền).
 * Backend chạy ở máy chủ KHÁC (VD Render) nên không thể tự đoán địa chỉ → production phải có BACKEND_URL.
 * Máy dev: mặc định http://localhost:4000.
 */
export function resolveBackendUrl() {
  if (process.env.BACKEND_URL) return trim(withProtocol(process.env.BACKEND_URL));
  if (process.env.VERCEL || process.env.RENDER || process.env.NETLIFY) {
    console.warn(
      "[mayqueen] Chưa đặt BACKEND_URL — site không gọi được API. Thêm BACKEND_URL (VD https://xxx.onrender.com) trong cài đặt môi trường.",
    );
  }
  return "http://localhost:4000";
}

/**
 * Header gắn vào MỌI request server Next gửi sang backend: mã bí mật chung (PROXY_SECRET, đặt cùng giá trị
 * ở Vercel và Render) → backend chỉ nhận request đi qua website, chặn ai gọi thẳng *.onrender.com.
 * Chỉ dùng ở server (proxy.js, Server Components, server action) — KHÔNG phải biến NEXT_PUBLIC_.
 */
export const PROXY_SECRET_HEADER = "x-proxy-secret";
export const backendHeaders = () =>
  process.env.PROXY_SECRET ? { [PROXY_SECRET_HEADER]: process.env.PROXY_SECRET } : {};

export const SITE_URL = resolveSiteUrl();
export const BACKEND_URL = resolveBackendUrl();
