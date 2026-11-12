"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { href, localize } from "@/i18n";
import { usePresence } from "@/hooks/usePresence";
import { lockScroll } from "@/lib/scroll";

// Bỏ dấu tiếng Việt + chữ thường để "giam can" / "GIẢM CÂN" vẫn ra "giảm cân" (đ → d)
const fold = (s = "") =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();

// Từ đồng nghĩa (đã bỏ dấu): gõ 1 từ trong nhóm thì tìm cả các từ còn lại (VD "combo" ↔ "bundle" bên EN)
const SYNONYMS = [
  ["combo", "bundle", "set", "kit"],
  ["detox", "cleanse", "thai doc"],
  ["giam can", "giam beo", "weight", "slim"],
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Từ đồng nghĩa so khớp nguyên từ (tránh "set" khớp nhầm "reset")
const wordRe = (w) => new RegExp(`(^|[^a-z0-9])${escapeRe(w)}($|[^a-z0-9])`);

/** Mỗi từ khóa phải có mặt (hoặc 1 từ đồng nghĩa của nó) trong nội dung đã bỏ dấu */
function matcher(query) {
  const k = fold(query).trim().replace(/\s+/g, " ");
  if (!k) return null;
  const tokens = k.split(" ");
  const alts = SYNONYMS.filter((g) => g.includes(k) || g.some((w) => tokens.includes(w))).flat();
  return (text) =>
    text.includes(k) ||
    alts.some((w) => wordRe(w).test(text)) ||
    tokens.every((tk) => text.includes(tk));
}

/**
 * Ô tìm kiếm toàn màn hình (nút kính lúp trên header): tìm trong sản phẩm + bài viết "Sống đẹp".
 * items: [{ type, title, sub, path, image, keywords? }] — dữ liệu ĐÃ localize, truyền từ layout.
 * keywords (chuỗi / mảng, tùy chọn): nội dung tìm thêm, VD short, ritual, benefits của sản phẩm.
 * Tìm không phân biệt hoa thường / dấu, mọi từ khóa phải có mặt, có vài từ đồng nghĩa (combo ↔ bundle…).
 */
export default function SearchOverlay({ open, onClose, lang, items, labels, returnFocus }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const { products } = useCart();
  const { mounted, closing } = usePresence(open, 320);
  const router = useRouter();
  // giữ onClose mới nhất trong ref → effect không chạy lại mỗi lần cha render
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  // Tab xoay vòng trong ô tìm kiếm; Esc / đóng → focus trở lại nút kính lúp trên header
  useFocusTrap(dialogRef, open, { initialFocus: inputRef, returnFocus });

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Nội dung tìm kiếm của từng mục (đã bỏ dấu): tên + mô tả + keywords (nếu layout truyền: short / ritual /
  // công dụng…) + danh mục sản phẩm (lấy từ dữ liệu giỏ hàng, VD "combo")
  const index = useMemo(() => {
    const category = {};
    for (const raw of products ?? []) {
      const p = localize(raw, lang);
      category[`/san-pham/${p.urlSlug}`] = p.category;
    }
    const str = (v) => (Array.isArray(v) ? v.filter(Boolean).join(" ") : (v ?? ""));
    return items.map((i) => ({
      item: i,
      title: fold(i.title),
      text: fold(`${i.title} ${i.sub ?? ""} ${str(i.keywords)} ${category[i.path] ?? ""}`),
    }));
  }, [items, products, lang]);

  const results = useMemo(() => {
    const match = matcher(q);
    if (!match) return items.filter((i) => i.type === "product");
    return index
      .filter((e) => match(e.text))
      .sort((a, b) => Number(match(b.title)) - Number(match(a.title))) // khớp tên lên trước
      .slice(0, 8)
      .map((e) => e.item);
  }, [q, items, index]);

  if (!mounted) return null;

  // Enter → mở kết quả đầu tiên (thay vì không có gì xảy ra)
  const openFirst = (e) => {
    e.preventDefault();
    if (!q.trim() || !results[0]) return;
    router.push(href(lang, results[0].path));
    onClose();
  };
  // Đọc cho trình đọc màn hình số kết quả khi gõ ("3 kết quả" / "Không tìm thấy")
  const announce = !q.trim()
    ? ""
    : results.length
      ? lang === "en"
        ? `${results.length} result${results.length > 1 ? "s" : ""}`
        : `${results.length} kết quả`
      : labels.empty;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={labels.open}
      className={`bg-forest-deep/70 fixed inset-0 z-[120] flex flex-col backdrop-blur-[2px] outline-none ${closing ? "pointer-events-none [animation:fadeOut_.32s_ease-in_both]" : "[animation:fadeIn_.3s_ease-out_both]"}`}
      onClick={onClose}
    >
      {/* Khung trắng cao tối đa bằng màn hình: ô nhập cố định, danh sách kết quả CUỘN bên trong
          (data-lenis-prevent: Lenis không chặn cuộn) → màn thấp (360×640) vẫn xem hết kết quả */}
      <div
        className={`bg-pearl flex max-h-[100svh] w-full flex-col ${closing ? "[animation:searchOut_.3s_cubic-bezier(.4,0,1,1)_both]" : "[animation:searchIn_.5s_cubic-bezier(.22,1,.36,1)_both]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-3xl shrink-0 px-5 pt-6 sm:pt-10">
          <form
            role="search"
            onSubmit={openFirst}
            className="border-forest/20 flex items-center gap-3 border-b pb-3"
          >
            <Search className="text-sage-600 size-5 shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={labels.placeholder}
              aria-label={labels.label}
              enterKeyHint="search"
              className="text-forest placeholder:text-ink-muted min-w-0 flex-1 bg-transparent font-serif text-2xl outline-none sm:text-3xl [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="hover:bg-sage-50 grid size-10 shrink-0 place-items-center rounded-full"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </form>
          <p className="eyebrow mt-6 pb-3">{q.trim() ? labels.results : labels.suggest}</p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announce}
          </p>
        </div>

        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-3xl px-5 pb-8">
            {results.length === 0 ? (
              <p className="text-ink-soft mt-1 text-sm">{labels.empty}</p>
            ) : (
              <ul className="divide-forest/10 divide-y">
                {results.map((r) => (
                  <li key={r.path}>
                    <Link
                      href={href(lang, r.path)}
                      onClick={onClose}
                      className="group hover:bg-sage-50 -mx-3 flex items-center gap-4 rounded-xl px-3 py-3 transition"
                    >
                      <span className="bg-sand relative size-14 shrink-0 overflow-hidden rounded-lg">
                        <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-sage-600 block text-[10.5px] font-semibold tracking-[0.18em] uppercase">
                          {r.type === "product" ? labels.product : labels.article}
                        </span>
                        <span className="text-forest group-hover:text-sage-700 block truncate font-serif text-lg">
                          {r.title}
                        </span>
                        <span className="text-ink-muted block truncate text-xs">{r.sub}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
