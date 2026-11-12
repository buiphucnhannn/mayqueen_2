"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { subscribeScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

const C = 2 * Math.PI * 22;

// Nút lên đầu trang (góc trái dưới) — vòng tròn hiển thị tiến độ cuộn.
// Vòng tiến độ ghi thẳng vào DOM qua ref (không setState mỗi frame); state chỉ đổi khi ẩn/hiện.
export default function BackToTop({ label }) {
  const ringRef = useRef(null);
  const [visible, setVisible] = useState(false);
  // Nút đè lên vùng có [data-fab-avoid] (VD icon mạng xã hội ở chân trang) → tạm ẩn để không che / bấm nhầm
  const [covering, setCovering] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll("[data-fab-avoid]");
    if (!targets.length) return;
    const near = new Set();
    // chỉ theo dõi dải 15% đáy màn hình (nơi đặt nút); mục nằm sát mép trái (cột của nút) mới tính là đè
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.boundingClientRect.left < 96) near.add(e.target);
          else near.delete(e.target);
        }
        setCovering(near.size > 0);
      },
      { rootMargin: "-85% 0px 0px 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let max = 1;
    let shown = false;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    const onScroll = (y) => {
      const p = Math.min(1, y / max);
      ringRef.current?.setAttribute("stroke-dashoffset", (C * (1 - p)).toFixed(1));
      if (p > 0.08 !== shown) {
        shown = p > 0.08;
        setVisible(shown);
      }
    };
    return subscribeScroll(onScroll, measure);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-[60] sm:bottom-6 sm:left-6">
      <button
        type="button"
        aria-label={label}
        onClick={() =>
          window.__lenis
            ? window.__lenis.scrollTo(0, { duration: 1.8 })
            : window.scrollTo({ top: 0, behavior: "smooth" })
        }
        className={cn(
          "bg-pearl text-forest shadow-card relative grid size-12 place-items-center rounded-full transition-[opacity,transform] duration-500",
          visible && !covering
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="2"
          />
          <circle
            ref={ringRef}
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="#5f7d41"
            strokeWidth="2"
            strokeDasharray={C}
            strokeDashoffset={C}
            strokeLinecap="round"
          />
        </svg>
        <ArrowUp className="size-[18px]" />
      </button>
    </div>
  );
}
