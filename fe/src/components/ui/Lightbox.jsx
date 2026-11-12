"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "@/components/ui/Img";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { lockScroll } from "@/lib/scroll";
import { NAV_LABELS, usePageLang } from "@/hooks/usePageLang";

/**
 * Popup xem ảnh toàn màn hình (kiểu ButStudio): bộ đếm 02 / 08, nút đóng, mũi tên trái/phải,
 * vuốt trên điện thoại, phím ← → Esc. Dưới ảnh là mô tả + link (tùy chọn).
 * items: [{ src, caption, text }]; index: số | null; onChange(i); onClose().
 * link: { href, label } — ví dụ "Xem trên Facebook".
 */
// document: true → khung lớn, ảnh hiển thị trọn (object-contain) — dùng cho giấy chứng nhận dọc/ngang
export default function Lightbox({ items, index, onChange, onClose, link, document = false }) {
  const navT = NAV_LABELS[usePageLang()];
  const open = index !== null && index !== undefined;
  const total = items.length;
  const touchX = useRef(null);
  const { mounted, closing } = usePresence(open, 300);
  // giữ ảnh cuối cùng để hiển thị trong lúc chạy hiệu ứng đóng
  const [shown, setShown] = useState(index);
  if (open && index !== shown) setShown(index);

  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open, onClose, prev, next]);

  if (!mounted) return null;
  const item = items[shown] ?? items[0];
  if (!item) return null;
  const navBtn =
    "grid size-12 place-items-center rounded-full bg-pearl/10 text-pearl transition hover:bg-pearl/25";

  // Gắn thẳng vào <body>: không bị khung cha có transform (hiệu ứng reveal, sticky…) giam vị trí fixed
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      onClick={onClose}
      className={`bg-forest-deep/95 fixed inset-0 z-[160] flex flex-col items-center justify-center px-4 backdrop-blur-sm ${closing ? "pointer-events-none [animation:fadeOut_.3s_ease-in_both]" : "[animation:fadeIn_.35s_ease-out_both]"}`}
    >
      <p className="text-pearl/60 absolute top-5 left-5 text-xs tracking-[0.3em] tabular-nums">
        {String(shown + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label={navT.close}
        className="bg-pearl/10 text-pearl hover:bg-pearl/25 absolute top-4 right-4 grid size-11 place-items-center rounded-full transition"
      >
        <X className="size-5" />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label={navT.prev}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className={`absolute top-1/2 left-4 hidden -translate-y-1/2 sm:grid ${navBtn}`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={navT.next}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className={`absolute top-1/2 right-4 hidden -translate-y-1/2 sm:grid ${navBtn}`}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Ảnh: vuốt trái/phải để chuyển (điện thoại) */}
      <div
        key={item.src}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        }}
        className={`shadow-soft relative [animation:lbIn_.55s_cubic-bezier(.22,1,.36,1)_both] touch-pan-y overflow-hidden select-none ${document ? "h-[min(72vh,900px)] w-[min(92vw,1000px)] rounded-md" : "aspect-square w-[min(88vw,70vh,680px)] rounded-2xl"}`}
      >
        <Image
          src={item.src}
          alt={item.caption}
          fill
          sizes={document ? "1000px" : "680px"}
          quality={90}
          className={document ? "object-contain" : "object-cover"}
        />
      </div>

      <div
        key={`${item.src}-text`}
        onClick={(e) => e.stopPropagation()}
        className="mt-6 max-w-xl [animation:fadeUp_.6s_cubic-bezier(.22,1,.36,1)_.1s_both] text-center"
      >
        <p className="text-pearl font-serif text-xl sm:text-2xl">{item.caption}</p>
        {item.text && (
          <p className="text-pearl/65 mt-2 text-[13.5px] leading-relaxed">{item.text}</p>
        )}
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="border-leaf text-leaf hover:text-pearl mt-4 inline-block border-b pb-0.5 text-[11.5px] font-semibold tracking-[0.16em] uppercase"
          >
            {link.label}
          </a>
        )}
      </div>

      {total > 1 && (
        <div className="mt-6 flex gap-3 sm:hidden" onClick={(e) => e.stopPropagation()}>
          <button type="button" aria-label={navT.prev} onClick={prev} className={navBtn}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label={navT.next} onClick={next} className={navBtn}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>,
    window.document.body, // (prop "document" che mất biến toàn cục cùng tên)
  );
}
