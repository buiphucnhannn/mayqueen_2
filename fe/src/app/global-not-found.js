import NotFoundView, { NOT_FOUND_COPY } from "@/components/common/NotFoundView";
import { siteConfig } from "@/config/site";
import { ICONS } from "@/lib/seo";
import { FontPreloads, fontClasses } from "@/lib/fonts";
import "./globals.css";

/**
 * 404 dự phòng cho URL không khớp route nào (bật qua experimental.globalNotFound trong next.config).
 * Thường không tới đây: proxy đã đưa mọi đường dẫn lạ về trang 404 đúng ngôn ngữ
 * ((nf-vi)/khong-tim-thay hoặc (nf-en)/page-not-found). Bản dự phòng dùng tiếng Việt.
 */
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  icons: ICONS,
  title: NOT_FOUND_COPY.vi.tab,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="vi" translate="no" className={`${fontClasses} notranslate`}>
      <body>
        <FontPreloads />
        <NotFoundView lang="vi" />
      </body>
    </html>
  );
}
