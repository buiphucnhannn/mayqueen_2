import { preload } from "react-dom";

/**
 * Font dùng chung cho mọi root layout (site [lang] + khu quản trị / trang hệ thống (system)).
 * Tiêu đề: serif sang (Cormorant Garamond — như web mẫu Kobler) - Nội dung: sans tiếng Việt đầy đủ.
 *
 * Tự phục vụ trong public/fonts, khai báo @font-face ở app/fonts.css (lý do: bỏ bộ latin-ext thừa của Google
 * Fonts, nhẹ hơn ~100KB mỗi lần mở trang). Chỉ đúng weight đang dùng: serif variable (thường + nghiêng),
 * sans 400/500/600/700.
 *
 * Báo trước (preload) cả 12 file trong <head> → font có sẵn ngay khi vẽ trang, chữ không "nhảy" từ font tạm
 * sang font thật (lý do trước đây đã gọn số weight để Next preload được).
 */
// Chỉ báo trước font của tiêu đề (serif thường) + chữ nội dung (sans 400) + nhãn / nút (sans 600) — có trên mọi
// trang, đúng phần dễ thấy "nhảy chữ". Serif nghiêng, sans 500 / 700: trang nào dùng thì trình duyệt tự tải
// (preload BẮT tải cả khi trang không dùng → phí ~65KB trên điện thoại).
const FILES = [
  "cormorant-latin",
  "cormorant-viet",
  ...[400, 600].flatMap((w) => [`bevietnam-${w}-latin`, `bevietnam-${w}-viet`]),
];

// Trang có dùng serif nghiêng + sans 500/700 ngay màn đầu (trang chủ, chi tiết sản phẩm) → báo trước luôn,
// tránh chữ hiện trễ / đổi font giữa chừng
const EXTRA = [
  "cormorant-italic-latin",
  "cormorant-italic-viet",
  ...[500, 700].flatMap((w) => [`bevietnam-${w}-latin`, `bevietnam-${w}-viet`]),
];

/** Gọi trong page dùng nhiều kiểu chữ ở màn đầu (server component) */
export function preloadAllFonts() {
  for (const f of EXTRA) preloadFont(f);
}

function preloadFont(f) {
  preload(`/fonts/${f}-v1.woff2`, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
    // ưu tiên thấp hơn ảnh chính đầu trang (LCP): font vẫn tải sớm (không nhảy chữ) nhưng không giành băng thông
    fetchPriority: "low",
  });
}

/** Đặt trong mỗi root layout — React đưa các thẻ <link rel="preload"> lên <head> */
export function FontPreloads() {
  for (const f of FILES) preloadFont(f);
  return null;
}

// Giữ tên cũ cho các layout (biến CSS --font-cormorant / --font-be-vietnam giờ khai báo ở :root trong fonts.css)
export const fontClasses = "";
