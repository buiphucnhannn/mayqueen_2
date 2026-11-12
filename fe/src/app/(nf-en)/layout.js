import { siteConfig } from "@/config/site";
import { ICONS } from "@/lib/seo";
import { FontPreloads, fontClasses } from "@/lib/fonts";
import "../globals.css";

/**
 * Khung riêng của trang 404 TIẾNG ANH (toàn màn hình, không header/footer của site).
 * Proxy lấy HTML trang này rồi trả kèm mã 404 thật cho mọi đường dẫn không tồn tại dưới /en.
 */
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  icons: ICONS,
  robots: { index: false, follow: false },
};

export default function NotFoundLayout({ children }) {
  return (
    <html lang="en" translate="no" className={`${fontClasses} notranslate`}>
      <body>
        <FontPreloads />
        {children}
      </body>
    </html>
  );
}
