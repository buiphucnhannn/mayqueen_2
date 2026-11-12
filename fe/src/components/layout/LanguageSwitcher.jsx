"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { LOCALES, switchLocalePath } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * VI / EN dạng chữ tối giản (light: chữ sáng khi header nằm trên nền tối) — giữ nguyên trang đang xem khi đổi ngôn ngữ.
 * Dùng thẻ <a> thường (tải trang đầy đủ) thay vì <Link>: đổi ngôn ngữ phải dựng lại cả <html lang>, metadata
 * và script ở <head>; điều hướng trong trang khiến React render lại <html> và cảnh báo về thẻ <script>.
 */
export default function LanguageSwitcher({ lang, slugs, light = false, className }) {
  const pathname = usePathname();
  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em]", className)}
    >
      {LOCALES.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && <span className={light ? "text-pearl/40" : "text-forest/25"}>/</span>}
          <a
            href={switchLocalePath(pathname, l, slugs)}
            hrefLang={l}
            // giữ tham số trên URL (VD trang tra cứu ?ma=MQ…&sdt=…) khi đổi ngôn ngữ → khách không phải nhập lại
            onClick={(e) => {
              const q = window.location.search;
              if (q) e.currentTarget.href = switchLocalePath(pathname, l, slugs) + q;
            }}
            aria-current={l === lang ? "true" : undefined}
            // px/py + margin âm: vùng chạm ~26×32px (chữ chỉ 16px) mà vị trí chữ, khoảng cách "VI / EN" giữ nguyên
            className={cn(
              "-mx-1.5 -my-2 inline-flex items-center px-1.5 py-2 uppercase transition",
              l === lang
                ? cn("underline underline-offset-4", light ? "text-pearl" : "text-forest")
                : light
                  ? "text-pearl/70 hover:text-pearl"
                  : "text-ink-muted hover:text-forest",
            )}
          >
            {l}
          </a>
        </Fragment>
      ))}
    </div>
  );
}
