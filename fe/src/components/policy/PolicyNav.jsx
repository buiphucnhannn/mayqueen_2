"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { sameSlug } from "@/components/policy/PolicyHeroCopy";
import { cn } from "@/lib/utils";

/**
 * Menu chính sách (cột trái, sticky) — nằm trong chinh-sach/layout.js nên KHÔNG bị dựng lại khi đổi chính sách.
 * - <Link> của Next: chỉ tải phần nội dung giữa (page.js) của chính sách mới (đã prefetch sẵn → tức thì).
 * - data-soft: hiệu ứng chuyển trang (components/fx/PageTransition) bỏ qua → không làm mờ cả trang.
 * - scroll={false}: giữ vị trí đọc; nếu đã cuộn qua đầu nội dung thì đưa về đầu nội dung (không nhảy lên banner).
 * items: [{ slug, title, href }]
 */
export default function PolicyNav({ items, label }) {
  const pathname = usePathname();
  const listRef = useRef(null);

  // Hàng chip cuộn ngang (điện thoại): luôn đưa chip đang chọn vào khung nhìn — chỉ cuộn NGANG trong hàng,
  // không đụng vị trí cuộn của trang (không dùng scrollIntoView).
  useEffect(() => {
    const ul = listRef.current;
    const act = ul?.querySelector('[aria-current="page"]');
    if (!ul || !act || ul.scrollWidth <= ul.clientWidth) return;
    const left = act.offsetLeft - (ul.clientWidth - act.offsetWidth) / 2;
    ul.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [pathname]);

  const onSelect = () => {
    const el = document.getElementById("policy-content");
    if (!el || el.getBoundingClientRect().top >= 0) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    if (window.__lenis) window.__lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    // điện thoại / tablet: hàng chip cuộn ngang (gọn, như tab Sống đẹp)
    // laptop+: menu dọc trong thẻ trắng ở thanh bên sticky (chinh-sach/layout.js), có tiêu đề nhỏ phía trên
    <nav
      aria-label={label}
      className="lg:border-forest/10 min-w-0 lg:rounded-2xl lg:border lg:bg-white lg:p-2.5"
    >
      <p className="text-sage-700 hidden px-4 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.22em] uppercase lg:block">
        {label}
      </p>
      <ul
        ref={listRef}
        className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-10 sm:px-10 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0"
      >
        {items.map((x) => {
          // so theo slug cuối (đường dẫn nội bộ lúc dựng sẵn ≠ đường dẫn công khai) — xem PolicyHeroCopy
          const active = sameSlug(x.href, pathname);
          return (
            <li key={x.slug} className="shrink-0">
              <Link
                href={x.href}
                scroll={false}
                data-soft=""
                onClick={onSelect}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group block rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 lg:flex lg:items-center lg:justify-between lg:rounded-xl lg:px-4 lg:py-2.5",
                  active
                    ? "bg-forest text-pearl"
                    : "bg-sage-50 text-ink-soft hover:bg-sage-100 hover:text-forest lg:hover:bg-sage-50 lg:bg-transparent",
                )}
              >
                {x.title}
                <ChevronRight
                  className={cn(
                    "hidden size-4 shrink-0 transition-transform duration-300 lg:block",
                    active
                      ? "opacity-100"
                      : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60",
                  )}
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
