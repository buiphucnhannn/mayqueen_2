"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Khối "dính" khi cuộn (máy tính ≥ lg) và luôn nằm GIỮA vùng nhìn thấy: khoảng trống từ đáy thanh menu tới khối
 * BẰNG khoảng trống từ đáy khối tới mép dưới màn hình.
 *   top = max(menu + 16px, (100vh + menu − chiều cao khối) / 2)
 * Chiều cao khối đo bằng ResizeObserver (đổi ảnh / đổi cỡ cửa sổ → tự tính lại). Khối cao hơn màn hình → bám sát
 * dưới menu như sticky thường.
 * header: chiều cao thanh menu khi đã cuộn (Header.jsx: lg:h-[72px]).
 */
export default function StickyCenter({ className, header = 72, children, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      el.style.setProperty(
        "--sticky-h",
        `${Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight)}px`,
      ),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ "--sticky-head": `${header}px` }}
      className={cn(
        "lg:sticky lg:top-[max(calc(var(--sticky-head)+1rem),calc((100vh+var(--sticky-head)-var(--sticky-h,0px))/2))] lg:self-start",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
