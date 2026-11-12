import { siteConfig } from "@/config/site";
import { ICONS } from "@/lib/seo";
import { FontPreloads, fontClasses } from "@/lib/fonts";
import "../globals.css";

/**
 * Root layout riêng cho khu hệ thống: đăng nhập, quản trị, trang 403 / 429.
 * Không có header/footer, giỏ hàng, hiệu ứng cuộn của site bán hàng; không cho Google index.
 */
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  icons: ICONS,
  title: { default: "Quản trị", template: `%s | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#0f1f15" };

export default function SystemLayout({ children }) {
  return (
    <html lang="vi" translate="no" className={`${fontClasses} notranslate`}>
      <body>
        <FontPreloads />
        {children}
      </body>
    </html>
  );
}
