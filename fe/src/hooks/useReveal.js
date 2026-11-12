"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { subscribeScroll } from "@/lib/scroll";

/**
 * Hiệu ứng hiện dần khi cuộn tới, cho mọi phần tử .reveal và .split.
 *
 * Chạy bằng Web Animations API (element.animate) thay vì thêm class: WAAPI chỉ đổi style tính toán,
 * KHÔNG đổi attribute/class trong DOM → React không bao giờ thấy lệch khi hydrate.
 * Trạng thái ẩn ban đầu nằm trong globals.css; `fill: "both"` giữ trạng thái hiện sau khi chạy xong.
 *
 * Tùy chọn trên phần tử:
 *   data-reveal="left|right|scale|clip"   kiểu chuyển động
 *   style={{ "--reveal-delay": "120ms" }}  độ trễ
 * Lưu ý: không đặt .reveal lên phần tử có transform inline (vd. <Parallax>) — bọc vào phần tử con.
 */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHOWN = { opacity: 1, transform: "none" };
const FRAMES = {
  default: [{ opacity: 0, transform: "translateY(28px)" }, SHOWN],
  left: [{ opacity: 0, transform: "translateX(-36px)" }, SHOWN],
  right: [{ opacity: 0, transform: "translateX(36px)" }, SHOWN],
  scale: [{ opacity: 0, transform: "scale(0.94)" }, SHOWN],
  fade: [{ opacity: 0, transform: "none" }, SHOWN],
  zoom: [{ transform: "scale(1.18)" }, { transform: "scale(1)" }],
  clip: [
    { clipPath: "inset(14% 8% 14% 8% round 2rem)" },
    { clipPath: "inset(0% 0% 0% 0% round 0rem)" },
  ],
};
const SPLIT_FRAMES = [
  { opacity: 0, transform: "translateY(0.35em)" },
  { opacity: 1, transform: "none" },
];

const SELECTOR = ".reveal, .split";
const ms = (cs, name, fallback = 0) => parseFloat(cs.getPropertyValue(name)) || fallback;

function reveal(el) {
  if (el.__revealed) return; // expando JS, không phải attribute → React không thấy
  el.__revealed = true;
  const cs = getComputedStyle(el);

  if (el.classList.contains("split")) {
    const base = ms(cs, "--base");
    const step = ms(cs, "--step", 45);
    el.querySelectorAll(".split-unit").forEach((unit, i) =>
      unit.animate(SPLIT_FRAMES, {
        duration: 800,
        delay: base + i * step,
        easing: EASE,
        fill: "both",
      }),
    );
    return;
  }

  const variant = el.dataset.reveal;
  el.animate(FRAMES[variant] || FRAMES.default, {
    duration:
      variant === "zoom" ? 2200 : variant === "clip" ? 1400 : variant === "fade" ? 900 : 950,
    delay: ms(cs, "--reveal-delay"),
    easing: EASE,
    fill: "both",
  });
}

export default function useReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px -4% 0px" }, // nhạy: vừa ló vào màn hình là hiện
    );
    const watched = new WeakSet();
    const watch = (el) => {
      if (el.__revealed || watched.has(el)) return;
      // khối đầu trang đã chạy hiệu ứng bằng CSS (globals.css .reveal-now) → không chạy lại
      if (el.closest(".reveal-now")) {
        el.__revealed = true;
        return;
      }
      watched.add(el);
      io.observe(el);
    };
    document.querySelectorAll(SELECTOR).forEach(watch);

    // Nội dung render sau (đổi tab, lọc bài viết, streaming) → theo dõi DOM để bắt .reveal mới
    const mo = new MutationObserver((records) => {
      for (const r of records)
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches(SELECTOR)) watch(node);
          node.querySelectorAll(SELECTOR).forEach(watch);
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Phần tử sát đáy trang (vd. dải cuối footer) có thể không bao giờ lọt vào vùng kích hoạt
    // (vùng quan sát chừa 8% đáy màn hình) → khi đã cuộn tới cuối trang, hiện mọi phần tử đang trong màn hình.
    const offScroll = subscribeScroll((y) => {
      if (y < document.documentElement.scrollHeight - window.innerHeight - 4) return;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.__revealed) return;
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top < window.innerHeight && r.bottom > 0) {
          reveal(el);
          io.unobserve(el);
        }
      });
    });

    return () => {
      offScroll();
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);
}
