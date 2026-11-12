"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { emitScroll } from "@/lib/scroll";

/**
 * Cuộn mượt toàn trang (Lenis) — cảm giác chậm, có quán tính, trôi nhẹ.
 * - lerp thấp: trang "đuổi theo" con lăn chậm hơn → mềm mại.
 * - wheelMultiplier < 1: mỗi nấc cuộn đi quãng ngắn hơn → chậm rãi, dễ ngắm ảnh.
 * - Touch (điện thoại) giữ cuộn native để không bị khựng.
 * Vùng cuộn riêng (giỏ hàng, menu) đặt data-lenis-prevent để cuộn độc lập.
 */
const HEADER_OFFSET = 96;
const easeOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

const scrollToTarget = (lenis, el, force = false) =>
  lenis.scrollTo(el, { offset: -HEADER_OFFSET, duration: 1.8, easing: easeOutExpo, force });

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.06,
      wheelMultiplier: 0.78,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.2,
      // Luôn bật (kể cả khi Windows/macOS tắt hiệu ứng chuyển động) — trải nghiệm cuộn chậm, mượt
      // là chủ đích của site (giống ButStudio). Lenis 1.3 mặc định TỰ TẮT khi gặp reduced-motion.
      respectReducedMotion: false,
    });
    window.__lenis = lenis;
    // Phát vị trí cuộn cho mọi hiệu ứng NGAY trong frame Lenis vừa cuộn (xem lib/scroll.js)
    lenis.on("scroll", ({ scroll }) => emitScroll(scroll));

    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Cuộn êm tới anchor (#id) kể cả link dạng "/#id" hoặc "/en#id" khi đang ở đúng trang đó.
    // Pha capture để chạy TRƯỚC handler của <Link>.
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank") return;
      const href = a.getAttribute("href");
      const hashIdx = href.indexOf("#");
      if (hashIdx === -1) return;
      const path = href.slice(0, hashIdx) || window.location.pathname;
      const norm = (p) => p.replace(/\/$/, "") || "/";
      if (norm(path) !== norm(window.location.pathname)) return;
      const target = document.getElementById(href.slice(hashIdx + 1));
      if (!target) return;
      e.preventDefault();
      history.pushState(null, "", href.slice(hashIdx));
      // Bấm từ menu mobile: chờ menu đóng (mở khóa cuộn) rồi mới cuộn
      setTimeout(() => scrollToTarget(lenis, target, true), 60);
    };
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // Đổi trang: về đầu trang; có hash (vd. /#tu-van từ trang khác) thì cuộn tới section
  useEffect(() => {
    const lenis = window.__lenis;
    lenis?.scrollTo(0, { immediate: true, force: true });
    const id = window.location.hash.slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    const timer = setTimeout(() => {
      if (window.__lenis) scrollToTarget(window.__lenis, target, true);
      else target.scrollIntoView({ behavior: "smooth" });
    }, 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
