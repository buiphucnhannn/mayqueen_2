import ErrorScreen from "@/components/ui/ErrorScreen";

/**
 * Nội dung trang 404 theo TỪNG ngôn ngữ — tiếng Việt toàn tiếng Việt, tiếng Anh toàn tiếng Anh
 * (chữ, link logo, nút bấm, dòng chân trang đều trỏ đúng đường dẫn của ngôn ngữ đó).
 */
export const NOT_FOUND_COPY = {
  vi: {
    tab: "Không tìm thấy trang | Mayqueen Slim",
    eyebrow: "Không tìm thấy trang",
    title: "Trang này đã lạc lối",
    text: "Đường dẫn có thể đã thay đổi hoặc không còn tồn tại. Hãy quay lại trang chủ hoặc khám phá sản phẩm của Mayqueen.",
    homeHref: "/",
    languagesLabel: "Ngôn ngữ",
    footer: "Mayqueen Slim - B.O.T Việt Nam",
    actions: [
      { href: "/", label: "Về trang chủ", primary: true },
      { href: "/san-pham", label: "Xem sản phẩm" },
    ],
  },
  en: {
    tab: "Page not found | Mayqueen Slim",
    eyebrow: "Page not found",
    title: "This page has wandered off",
    text: "The link may have changed or no longer exists. Head back to the homepage or explore Mayqueen's products.",
    homeHref: "/en",
    languagesLabel: "Language",
    footer: "Mayqueen Slim - B.O.T Vietnam",
    actions: [
      { href: "/en", label: "Back to home", primary: true },
      { href: "/en/shop", label: "Browse products" },
    ],
  },
};

/**
 * embedded = true: nằm trong layout site (có header/footer của site) — dùng cho [lang]/not-found.js.
 * Mặc định: màn hình 404 toàn trang (logo, mã 404 lớn, nút, chân trang) — trang 404 chính của site.
 */
export default function NotFoundView({ lang = "vi", embedded = false }) {
  const { tab, ...copy } = NOT_FOUND_COPY[lang] ?? NOT_FOUND_COPY.vi;
  // Nút VI / EN: ngôn ngữ đang xem đánh dấu hiện tại; ngôn ngữ kia trỏ tới TRANG CHỦ của ngôn ngữ đó
  // (chuẩn SEO: trang 404 chỉ dẫn tới trang có thật, không trỏ sang một trang 404 khác; trang 404 noindex
  // nên không khai báo hreflang / canonical).
  const languages = [
    { code: "vi", href: "/", title: "Tiếng Việt", current: lang === "vi" },
    { code: "en", href: "/en", title: "English", current: lang === "en" },
  ];
  return <ErrorScreen code="404" embedded={embedded} languages={languages} {...copy} />;
}
