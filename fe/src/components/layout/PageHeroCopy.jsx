import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Phần chữ của banner trang con (đường dẫn + dòng nhỏ + tiêu đề 2 màu + mô tả) — dùng trong PageHero.
 * Tách riêng để trang chính sách đổi chữ theo từng chính sách mà KHÔNG dựng lại ảnh nền (PolicyHeroCopy).
 */
export default function PageHeroCopy({ crumbs = [], eyebrow, title, accent, text, children }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="reveal mb-7">
        <ol className="text-pearl/85 flex flex-wrap items-center gap-2 text-xs">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
              {c.href ? (
                <Link href={c.href} className="hover:text-sage-300">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-pearl">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {eyebrow && (
        <p className="reveal text-sage-300 mb-4 text-[11px] font-semibold tracking-[0.3em] uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="reveal h-lux text-pearl text-[32px] sm:text-[42px] lg:text-[50px]">
        {title} {accent && <span className="text-sage-300">{accent}</span>}
      </h1>
      {text && (
        <p
          className="reveal text-pearl/85 mt-5 line-clamp-3 max-w-2xl font-serif text-[18px] leading-relaxed sm:text-[20px]"
          style={{ "--reveal-delay": "160ms" }}
        >
          {text}
        </p>
      )}
      {children}
    </>
  );
}
