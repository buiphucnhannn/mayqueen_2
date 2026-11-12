import { siteConfig } from "@/config/site";
import { href } from "@/i18n";

/** Ảnh xem trước mặc định khi chia sẻ (app/opengraph-image.js — 1200×630: ảnh sản phẩm + logo + khẩu hiệu) */
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630 };

/**
 * Favicon: file tĩnh trong public/, URL CỐ ĐỊNH (không kèm mã băm như quy ước file app/icon của Next, vốn đổi
 * mỗi lần build → Google phải đọc lại). Theo yêu cầu favicon của Google Search: khai báo <link rel="icon"> ở trang
 * chủ, ảnh vuông bội số của 48px, URL ổn định, không chuyển hướng, robots.txt cho phép.
 * favicon.ico chứa 16/32/48/256 (256 → Google đọc nhanh, nét trên màn hình độ phân giải cao).
 * Chỉ ICO + PNG: Google không đọc SVG. /favicon.ico & /apple-touch-icon.png cũng là đường dẫn trình duyệt tự tìm.
 * Đổi logo → thay 3 file public/favicon.ico, icon-192.png, apple-touch-icon.png (giữ nguyên tên).
 */
export const ICONS = {
  icon: [
    { url: "/favicon.ico", sizes: "16x16 32x32 48x48 256x256", type: "image/x-icon" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};

/**
 * Metadata ĐẦY ĐỦ cho 1 trang (dùng trong generateMetadata của mọi trang công khai):
 * - title / description
 * - canonical + hreflang vi / en / x-default (x-default = bản tiếng Việt)
 * - openGraph + twitter RIÊNG của trang: tiêu đề, mô tả, link (og:url), ảnh → khung xem trước khi dán link
 *   vào Zalo / Facebook / Messenger hiện đúng trang. (Next không gộp sâu openGraph: trang không khai báo sẽ
 *   lấy nguyên khối của layout = thông tin trang chủ → phải khai báo đủ ở từng trang.)
 *
 * @param lang         "vi" | "en"
 * @param path         { vi, en } — đường dẫn TIẾNG VIỆT kiểu "/san-pham/x" (qua href() thành URL thật)
 * @param title        chuỗi (layout thêm " | Mayqueen Slim") hoặc { absolute } (xem seoTitle)
 * @param image        ảnh xem trước { url, width?, height? } — trống → ảnh mặc định của thương hiệu
 */
export function pageMeta({
  lang,
  path,
  title,
  description,
  image,
  imageAlt,
  type = "website",
  extra,
}) {
  const site = siteConfig.name;
  const fullTitle = typeof title === "object" ? title.absolute : `${title} | ${site}`;
  const url = href(lang, path[lang]);
  const img = { ...(image ?? DEFAULT_OG_IMAGE), alt: imageAlt || fullTitle };
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        vi: href("vi", path.vi),
        en: href("en", path.en),
        "x-default": href("vi", path.vi),
      },
    },
    openGraph: {
      type,
      siteName: site,
      locale: lang === "vi" ? "vi_VN" : "en_US",
      alternateLocale: lang === "vi" ? "en_US" : "vi_VN",
      url,
      title: fullTitle,
      description,
      images: [img],
      ...extra,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [img.url] },
  };
}

/**
 * Tên tab / thẻ <title> chuẩn SEO cho trang có nội dung động (sản phẩm, bài viết):
 * - Từ khóa chính đứng TRƯỚC, thương hiệu đứng SAU ("… | Mayqueen Slim" — do template của layout thêm vào).
 * - Tổng tối đa ~65 ký tự (Google cắt phần dư bằng "…").
 * - Tên đã có sẵn thương hiệu (VD "Mayqueen Slim", "Combo Mayqueen Slim + …") → không gắn thêm hậu tố (tránh lặp).
 * - Phần phụ (khẩu hiệu) quá dài → thử đoạn trước dấu phẩy; vẫn dài thì bỏ hậu tố thương hiệu (giữ từ khóa);
 *   vẫn dài nữa mới bỏ phần phụ.
 * - Tên quá dài (VD tiêu đề bài viết) → bỏ hậu tố thương hiệu, giữ nguyên tên.
 *
 * Trả về giá trị dùng được cho `metadata.title` (chuỗi → có hậu tố; { absolute } → không hậu tố).
 */
export const TITLE_MAX = 65;
const SUFFIX = ` | ${siteConfig.name}`;

export function seoTitle(main, extra) {
  main = String(main ?? "").trim();
  const hasBrand = main.toLowerCase().includes(siteConfig.name.toLowerCase());
  const fits = (s) => (hasBrand ? s : s + SUFFIX).length <= TITLE_MAX;
  const out = (s) => (hasBrand ? { absolute: s } : s);

  const ex = String(extra ?? "").trim();
  if (ex) {
    const parts = [ex, ex.split(/[,;–—]/)[0].trim()].filter(Boolean);
    for (const part of parts) {
      const s = `${main} – ${part}`;
      if (fits(s)) return out(s);
    }
    // Có hậu tố thì dài quá nhưng bỏ hậu tố vẫn vừa → giữ khẩu hiệu (chứa từ khóa) thay vì chỉ còn tên trần
    for (const part of parts) {
      const s = `${main} – ${part}`;
      if (s.length <= TITLE_MAX) return { absolute: s };
    }
  }
  if (fits(main)) return out(main);
  return { absolute: main };
}
