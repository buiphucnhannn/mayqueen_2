"use client";

import { useEffect, useRef } from "react";

const TOP = 112; // ngay dưới header (= top-28)
const GAP = 24; // chừa khoảng cách với đáy màn hình

/**
 * Thanh bên dính (sticky) luôn NHÌN THẤY TRỌN VẸN:
 * - Màn đủ cao: dính sát dưới header (top 112px) như bình thường.
 * - Màn thấp / trình duyệt phóng to (thanh bên cao hơn khoảng trống): top âm → thanh bên cuộn theo trang
 *   tới khi đáy chạm đáy màn hình (cách 24px) rồi mới dính → không bao giờ bị cắt mất phần dưới.
 * Chỉ áp dụng từ laptop (lg) — điện thoại/tablet thanh bên không dính.
 */
export default function StickySide({ className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const fit = () => {
      if (!mq.matches) return el.style.removeProperty("top");
      const top = Math.min(TOP, window.innerHeight - el.offsetHeight - GAP);
      el.style.top = `${top}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    mq.addEventListener("change", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      mq.removeEventListener("change", fit);
    };
  }, []);

  return (
    <aside ref={ref} className={className}>
      {children}
    </aside>
  );
}
