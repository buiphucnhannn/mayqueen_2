"use client";

import { useEffect, useRef } from "react";

/**
 * Số chạy từ 0 tới `value` khi cuộn tới (1 lần). Ghi thẳng textContent (không setState mỗi frame).
 * Server render sẵn số cuối → không JS / chưa cuộn tới vẫn đọc được đúng số.
 */
export default function CountUp({ value, suffix = "", duration = 1800, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = `0${suffix}`;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(value * eased)}${suffix}`;
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
