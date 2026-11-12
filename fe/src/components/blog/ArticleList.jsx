"use client";

import { useEffect, useRef, useState } from "react";
import ArticleCard from "@/components/blog/ArticleCard";
import { cn } from "@/lib/utils";

/**
 * Danh sách bài viết có lọc theo chuyên mục. Chuyên mục đọc từ hash URL (/song-dep#detox)
 * (link ở chân trang) → chọn đúng chủ đề rồi LƯỚT MƯỢT tới danh sách (chừa chỗ cho header cố định).
 * Bấm link khi đang ở chính trang này (Next đổi URL bằng pushState, không có sự kiện hashchange)
 * → bắt sự kiện click trên link có hash trùng chuyên mục.
 */
export default function ArticleList({ lang, articles, categories, labels, featuredSlug }) {
  const [tab, setTab] = useState("all");
  const rootRef = useRef(null);
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.id, c.label]));

  useEffect(() => {
    const ids = new Set(categories.map((c) => c.id));
    const glide = (delay) =>
      setTimeout(() => {
        const el = rootRef.current;
        if (!el) return;
        if (window.__lenis) window.__lenis.scrollTo(el, { offset: -130, duration: 1.4 });
        else
          window.scrollTo({
            top: el.getBoundingClientRect().top + scrollY - 130,
            behavior: "smooth",
          });
      }, delay);
    const open = (id, delay) => {
      if (!ids.has(id)) return null;
      setTab(id);
      return glide(delay);
    };
    // vào trang kèm hash (từ trang khác): chờ hiệu ứng chuyển trang xong rồi lướt
    const t = open(window.location.hash.slice(1), 650);
    const onClick = (e) => {
      const a = e.target.closest?.('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !ids.has(url.hash.slice(1))) return;
      e.preventDefault();
      history.replaceState(null, "", url.hash);
      open(url.hash.slice(1), 0);
    };
    const onHash = () => open(window.location.hash.slice(1), 0);
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHash);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHash);
    };
  }, [categories]);

  const select = (id) => {
    setTab(id);
    history.replaceState(null, "", id === "all" ? window.location.pathname : `#${id}`);
  };

  // "Tất cả": bỏ bài nổi bật (đã hiện to ở trên). Lọc theo danh mục: gồm cả bài nổi bật nếu cùng danh mục
  // (trước đây bài nổi bật bị loại hẳn → lọc đúng danh mục của nó lại không thấy bài).
  const shown =
    tab === "all"
      ? articles.filter((a) => a.slug !== featuredSlug)
      : articles.filter((a) => a.category === tab);

  return (
    <div ref={rootRef}>
      <div role="tablist" className="reveal no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            aria-selected={tab === c.id}
            onClick={() => select(c.id)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold transition",
              tab === c.id ? "bg-forest text-pearl" : "bg-sage-50 text-ink-soft hover:bg-sage-100",
            )}
            title={c.label}
          >
            <span className="block max-w-[14rem] truncate">{c.label}</span>
          </button>
        ))}
      </div>
      {/* tiêu đề ẩn (trình đọc màn hình / SEO): trang đi đúng thứ bậc h1 → h2 → h3 (tiêu đề thẻ bài) */}
      <h2 className="sr-only">{lang === "en" ? "Articles" : "Danh sách bài viết"}</h2>
      <ul className="mt-8 grid gap-x-10 gap-y-2 md:grid-cols-2">
        {shown.map((a, i) => (
          <li
            key={`${tab}-${a.slug}`}
            className="reveal border-forest/10 border-b py-3"
            style={{ "--reveal-delay": `${(i % 4) * 80}ms` }}
          >
            <ArticleCard
              article={a}
              lang={lang}
              categoryLabel={categoryLabels[a.category]}
              labels={labels}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
