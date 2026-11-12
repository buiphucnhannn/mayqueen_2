"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bản đồ Google THẬT nhúng trực tiếp: kéo, zoom, xem đường, bấm "Mở trong Maps" / chỉ đường.
 *
 * Vì sao có lớp phủ: site cuộn mượt bằng Lenis (bắt sự kiện lăn chuột của trang). iframe Google Maps là
 * trang KHÁC nguồn — con trỏ lướt qua bản đồ thì lăn chuột rơi vào iframe, Lenis mất sự kiện, trình duyệt
 * tự cuộn kiểu gốc (giật cục) lệch với vị trí Lenis đang trượt tới → trang khựng/nhảy, kèm lớp
 * "Sử dụng ctrl + cuộn…" nháy lên.
 * → Phủ 1 lớp trong suốt: lăn chuột vẫn thuộc về trang (cuộn mượt liền mạch). Bấm vào bản đồ mới mở khóa
 *   để tương tác; rê chuột ra ngoài thì khóa lại.
 */
export default function MapEmbed({ src, title, hint, className }) {
  const [active, setActive] = useState(false);
  // Chỉ gắn iframe khi khung bản đồ sắp vào màn hình: Google Maps kéo theo ~350KB JavaScript — loading="lazy"
  // của trình duyệt vẫn tải sớm khi trang ngắn (ngưỡng ~1250–2500px) → làm chậm lúc mở trang trên điện thoại.
  const boxRef = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={cn("group bg-pearl/5 relative overflow-hidden", className)}
      onMouseLeave={() => setActive(false)}
    >
      {near && (
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      )}
      {!active && (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={hint}
          className="absolute inset-0 flex cursor-pointer items-end justify-center pb-4"
        >
          {/* gợi ý chỉ hiện khi rê chuột (máy tính) — điện thoại chạm 1 lần là dùng được */}
          <span className="bg-forest/85 text-pearl pointer-events-none flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <MousePointerClick className="size-3.5" aria-hidden="true" />
            {hint}
          </span>
        </button>
      )}
    </div>
  );
}
