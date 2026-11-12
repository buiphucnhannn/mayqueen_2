import { BACKEND_URL } from "./src/config/urls.mjs";
import { SEGMENTS_EN } from "./src/i18n/routes.mjs";

// Backend (thư mục be/). Trình duyệt luôn gọi /api/v1 cùng origin → Next chuyển tiếp tới đây,
// nhờ vậy cookie đăng nhập là cookie first-party (SameSite=Strict). Chỉ server biết địa chỉ này.
// Không trỏ cứng localhost: production lấy BACKEND_URL, máy dev mặc định localhost:4000 (src/config/urls.mjs)
const isProd = process.env.NODE_ENV === "production";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // build kiểm tra song song với "next dev" mà không đụng thư mục .next đang dùng: NEXT_DIST_DIR=.next-check
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Hosting cPanel (Setup Node.js App): NEXT_OUTPUT=standalone → .next/standalone/server.js chạy độc lập,
  // kèm sẵn node_modules tối thiểu (không cần npm install trên hosting). Vercel không đặt biến này → như cũ.
  ...(process.env.NEXT_OUTPUT === "standalone" && {
    output: "standalone",
    outputFileTracingRoot: import.meta.dirname,
  }),
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    // Trang 404 riêng cho URL không khớp route nào (app có nhiều root layout: [lang] + (system))
    globalNotFound: true,
    // Nhúng CSS thẳng vào HTML (bản build): bỏ 1 lượt tải file CSS chặn hiển thị → điện thoại 4G hiện nội
    // dung đầu trang sớm hơn (~300ms). CSS cả site nhỏ (~22KB nén) nên HTML chỉ nặng thêm không đáng kể.
    inlineCss: true,
    // Chỉ đưa vào bundle đúng icon được dùng
    optimizePackageImports: ["lucide-react"],
    // Tối ưu ảnh (/_next/image) dùng 1 luồng / ảnh. Mặc định Next mở số luồng = nửa số nhân CPU của MÁY CHỦ
    // (hosting chia sẻ có 96 nhân → 48 luồng / ảnh) trong khi tài khoản cPanel chỉ được tối đa 100 tiến trình
    // + luồng cho TẤT CẢ app → vài ảnh tải cùng lúc là chạm trần: app khác không khởi động được, site báo 508.
    imgOptConcurrency: 1,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 bắt buộc khai báo danh sách quality; ảnh sản phẩm dùng 90 cho nét
    // 30: dành riêng cho nền nhoè (PhotoBackdrop) — URL khác hẳn ảnh thường nên trình duyệt
    // không lấy nhầm bản ảnh lớn đã cache (gây "bóng" sản phẩm sắc nét phía sau chữ).
    qualities: [30, 60, 75, 80, 85, 90],
    // ảnh đã tối ưu (/_next/image) cho trình duyệt giữ 30 ngày (mặc định chỉ 4 giờ → khách quay lại phải tải lại)
    minimumCacheTTL: 2592000,
    // Ảnh sản phẩm / bài viết upload trong Admin nằm trên Cloudinary. Trình duyệt tải THẲNG từ CDN Cloudinary
    // qua components/ui/Img.jsx (loader riêng cho ảnh Cloudinary). KHÔNG đặt loader "custom" ở đây:
    // làm vậy Next tắt luôn /_next/image → mọi ảnh trong /public (logo, chứng nhận…) hỏng.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Tiếng Việt mặc định tại "/", tiếng Anh tại "/en" (route thật nằm ở app/[lang]/<đoạn tiếng Việt>)
  async rewrites() {
    const vi = Object.keys(SEGMENTS_EN).flatMap((seg) => [
      { source: `/${seg}`, destination: `/vi/${seg}` },
      { source: `/${seg}/:slug`, destination: `/vi/${seg}/:slug` },
    ]);
    const en = Object.entries(SEGMENTS_EN).flatMap(([seg, enSeg]) => [
      { source: `/en/${enSeg}`, destination: `/en/${seg}` },
      { source: `/en/${enSeg}/:slug`, destination: `/en/${seg}/:slug` },
    ]);
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` },
      { source: "/", destination: "/vi" },
      ...vi,
      ...en,
    ];
  },
  async headers() {
    // Ảnh / video tĩnh trong public/: cho trình duyệt giữ 30 ngày (đổi ảnh thì nên đổi tên file để khách thấy ngay)
    const longCache = [
      { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
    ];
    return [
      { source: "/images/:path*", headers: longCache },
      { source: "/videos/:path*", headers: longCache },
      // font có hậu tố phiên bản (-v1) → giữ 1 năm, không bao giờ cần hỏi lại máy chủ
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
