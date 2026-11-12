"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Dòng "Chưa chuyển khoản được? Xem lại mã QR ›" (màn đặt hàng thành công, trang tra cứu đơn):
 * bấm mở → khung QR hiện ra bên dưới và trang TỰ CUỘN MƯỢT tới chỗ thấy trọn khung QR (dòng bấm vẫn nằm phía trên
 * làm mốc). Không gạch chân khi rê chuột — chỉ đổi màu.
 */
export default function QrReveal({ label, className, children }) {
  const ref = useRef(null);

  const onToggle = (e) => {
    if (!e.currentTarget.open) return; // chỉ cuộn khi MỞ
    // đợi khung QR vẽ xong (ảnh QR dựng bất đồng bộ) rồi mới tính vị trí
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // ưu tiên: đáy khung QR lọt hẳn vào màn hình (chừa 24px); nhưng không kéo quá làm dòng bấm chui dưới menu
      const fitBottom = r.bottom - window.innerHeight + 24;
      const keepSummary = r.top - 110;
      const delta = Math.min(fitBottom, keepSummary);
      if (delta <= 8) return; // đã thấy đủ → không cuộn
      const y = window.scrollY + delta;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.8 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    }, 120);
  };

  return (
    <details ref={ref} onToggle={onToggle} className={cn("group", className)}>
      <summary className="text-sage-700 hover:text-forest focus-visible:outline-sage-400 inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
        {label}
        <span className="transition-transform group-open:rotate-90" aria-hidden="true">
          ›
        </span>
      </summary>
      {children}
    </details>
  );
}
