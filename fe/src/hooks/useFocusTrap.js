"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Phần tử thật sự nhận focus được: không nằm trong vùng inert / aria-hidden, đang hiển thị, không bị tabIndex -1
const usable = (el) =>
  !!el &&
  el.isConnected &&
  typeof el.focus === "function" &&
  el !== document.body &&
  !el.closest("[inert]") &&
  el.getClientRects().length > 0 &&
  getComputedStyle(el).visibility !== "hidden";

/**
 * Quản lý focus cho hộp thoại (popup tư vấn, giỏ hàng, ô tìm kiếm):
 * - Mở: đưa focus vào trong hộp thoại (initialFocus nếu có, không thì phần tử bấm được đầu tiên).
 * - Tab / Shift+Tab: chỉ xoay vòng bên trong hộp thoại.
 * - Đóng (Esc, bấm nền, nút X…): trả focus về phần tử đã mở hộp thoại
 *   (returnFocus.current nếu truyền vào, mặc định là phần tử đang focus lúc mở).
 */
export function useFocusTrap(ref, active, { initialFocus, returnFocus } = {}) {
  // giữ tuỳ chọn mới nhất trong ref → effect chỉ chạy lại khi bật / tắt
  const opts = useRef({ initialFocus, returnFocus });
  useEffect(() => {
    opts.current = { initialFocus, returnFocus };
  });

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const opener = opts.current.returnFocus?.current ?? document.activeElement;

    const items = () => [...root.querySelectorAll(FOCUSABLE)].filter(usable);

    // chờ 1 frame: hộp thoại vừa gỡ inert / vừa gắn vào DOM
    const raf = requestAnimationFrame(() => {
      if (root.contains(document.activeElement)) return; // tự focus rồi (VD ô tìm kiếm)
      const target = opts.current.initialFocus?.current;
      (usable(target) ? target : (items()[0] ?? root)).focus({ preventScroll: true });
    });

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      // chỉ trả focus khi focus đang ở trong hộp thoại / đã rơi về body (không giật focus người dùng vừa chuyển đi nơi khác)
      const now = document.activeElement;
      if ((!now || now === document.body || root.contains(now)) && usable(opener))
        opener.focus({ preventScroll: true });
    };
  }, [active, ref]);
}
