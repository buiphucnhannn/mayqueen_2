"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "@/components/ui/Img";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize2 } from "lucide-react";
import dynamic from "next/dynamic";

// trình xem ảnh chỉ mở khi bấm → file JS riêng, tải sau khi trang đã hiện (không nằm trên đường tải đầu trang)
const Lightbox = dynamic(() => import("@/components/ui/Lightbox"));
import { cn } from "@/lib/utils";
import { NAV_LABELS, usePageLang } from "@/hooks/usePageLang";

/**
 * Thư viện ảnh trang chi tiết: ảnh lớn chuyển mờ + dải ảnh nhỏ. Bấm ảnh lớn → mở trình xem ảnh (lightbox).
 * - Ảnh lớn LUÔN là khung vuông (items-start: không bị cột ảnh nhỏ kéo cao thành khung đứng → cắt mép ảnh).
 * - Máy tính: cột ảnh nhỏ cao đúng bằng ảnh lớn (nội dung đặt absolute), nhiều ảnh thì cuộn dọc
 *   (lăn chuột / nút mũi tên; mép mờ báo còn ảnh); điện thoại: dải ngang vuốt được.
 * - object-contain: hiện TRỌN ảnh (ảnh infographic có chữ không bị cắt, kể cả ảnh tải lên không vuông).
 */
export default function ProductGallery({ images, name, badge }) {
  const navT = NAV_LABELS[usePageLang()];
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(null);
  const items = images.map((src, i) => ({ src, caption: `${name} - ${i + 1}/${images.length}` }));
  const strip = useRef(null);
  const [edge, setEdge] = useState({ start: false, end: false }); // còn ảnh phía trước / phía sau?

  // Cột (máy tính: dọc) / dải (điện thoại: ngang) ảnh nhỏ: biết còn ảnh bị khuất ở đầu / cuối không
  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const vertical = el.scrollHeight > el.clientHeight + 1;
    const pos = vertical ? el.scrollTop : el.scrollLeft;
    const max = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    setEdge({ start: pos > 4, end: pos < max - 4 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, images.length]);

  // Ảnh đang chọn (bấm ảnh nhỏ / chuyển trong trình xem ảnh lớn) luôn nằm trong khung — chỉ cuộn dải ảnh nhỏ
  useEffect(() => {
    const el = strip.current;
    const btn = el?.children[active];
    if (!el || !btn) return;
    const vertical = el.scrollHeight > el.clientHeight + 1;
    if (vertical) {
      const top = btn.offsetTop - (el.clientHeight - btn.offsetHeight) / 2;
      el.scrollTo({ top, behavior: "smooth" });
    } else {
      const left = btn.offsetLeft - (el.clientWidth - btn.offsetWidth) / 2;
      el.scrollTo({ left, behavior: "smooth" });
    }
  }, [active]);

  const nudge = (dir) => {
    const el = strip.current;
    if (!el) return;
    const vertical = el.scrollHeight > el.clientHeight + 1;
    const step = (vertical ? el.clientHeight : el.clientWidth) * 0.7 * dir;
    el.scrollBy(vertical ? { top: step, behavior: "smooth" } : { left: step, behavior: "smooth" });
  };
  const arrow =
    "bg-pearl/95 text-forest hover:bg-pearl absolute z-10 grid size-8 place-items-center rounded-full shadow-md ring-1 ring-forest/10 transition";

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
      {/* p-1: chừa chỗ cho viền + khoảng hở của ảnh đang chọn (khung cuộn cắt mất nếu sát mép) */}
      <div className="relative shrink-0 max-lg:[contain:inline-size] lg:w-24 lg:self-stretch">
        {/* data-lenis-prevent: lăn chuột / vuốt trong dải ảnh nhỏ cuộn chính nó (không bị cuộn mượt của trang chặn).
            Mép mờ dần báo còn ảnh bị khuất */}
        <div
          ref={strip}
          onScroll={measure}
          data-lenis-prevent
          className={cn(
            "no-scrollbar -m-1 flex gap-3 overflow-x-auto overscroll-contain p-1 lg:absolute lg:inset-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto",
            edge.end &&
              !edge.start &&
              "[mask-image:linear-gradient(to_right,#000_80%,transparent)] lg:[mask-image:linear-gradient(to_bottom,#000_80%,transparent)]",
            edge.start &&
              !edge.end &&
              "[mask-image:linear-gradient(to_left,#000_80%,transparent)] lg:[mask-image:linear-gradient(to_top,#000_80%,transparent)]",
            edge.start &&
              edge.end &&
              "[mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)] lg:[mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)]",
          )}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${name} ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "ring-offset-pearl relative size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-offset-2 transition duration-300 lg:size-24",
                i === active ? "ring-sage-600" : "opacity-60 ring-transparent hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
        {/* nút cuộn dải ảnh nhỏ — chỉ hiện khi còn ảnh bị khuất (máy tính: lên/xuống, điện thoại: trái/phải) */}
        {edge.start && (
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label={navT.prevImage}
            className={cn(
              arrow,
              "top-1/2 left-0 -translate-y-1/2 lg:top-0 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-0",
            )}
          >
            <ChevronLeft className="size-4 lg:hidden" aria-hidden="true" />
            <ChevronUp className="hidden size-4 lg:block" aria-hidden="true" />
          </button>
        )}
        {edge.end && (
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label={navT.nextImage}
            className={cn(
              arrow,
              "top-1/2 right-0 -translate-y-1/2 lg:top-auto lg:right-auto lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-0",
            )}
          >
            <ChevronRight className="size-4 lg:hidden" aria-hidden="true" />
            <ChevronDown className="hidden size-4 lg:block" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setViewer(active)}
        aria-label={name}
        className="group bg-sage-50 relative aspect-square w-full flex-1 cursor-zoom-in overflow-hidden rounded-md"
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} – ${i + 1}`}
            fill
            priority={i === 0}
            quality={90}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn(
              "object-contain transition-opacity duration-700 ease-out",
              i === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {/* gợi ý bấm để xem lớn */}
        <span className="bg-pearl/90 text-forest absolute top-4 right-4 grid size-10 place-items-center rounded-full opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>
        {badge && (
          <span className="bg-forest text-pearl absolute bottom-5 left-5 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase">
            {badge}
          </span>
        )}
      </button>

      <Lightbox
        items={items}
        index={viewer}
        onChange={(i) => {
          setViewer(i);
          setActive(i);
        }}
        onClose={() => setViewer(null)}
      />
    </div>
  );
}
