"use client";

import { usePathname } from "next/navigation";
import SiteErrorView from "@/components/common/SiteErrorView";
import "./globals.css";

/**
 * Lỗi ngay ở layout gốc (VD backend sập đúng lúc cache sản phẩm hết hạn → layout không lấy được dữ liệu):
 * thay cho trang lỗi trắng mặc định của Next bằng màn lỗi có nhận diện thương hiệu + hotline, song ngữ.
 * Layout gốc không chạy được nên file này tự có <html>/<body>.
 */
export default function GlobalError({ reset }) {
  const lang = usePathname()?.startsWith("/en") ? "en" : "vi";
  return (
    <html lang={lang} translate="no" className="notranslate">
      <body>
        <SiteErrorView reset={reset} />
      </body>
    </html>
  );
}
