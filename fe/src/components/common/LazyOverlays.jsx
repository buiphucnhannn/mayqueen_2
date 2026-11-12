"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

/**
 * Các cửa sổ chỉ hiện khi khách bấm (giỏ hàng, popup tư vấn) → tách file JavaScript riêng, tải SAU khi trang
 * đã hiện xong (window load + lúc rảnh). Lúc mở trang trình duyệt bớt phải tải + chạy ~20KB JS → nội dung đầu
 * trang hiện sớm hơn trên điện thoại. Giao diện / hiệu ứng không đổi.
 *
 * Khách bấm mở TRƯỚC khi kịp tải (vài trăm ms đầu): giữ lại lần bấm → tải ngay → mở bình thường.
 */
const loadCart = () => import("@/components/cart/CartDrawer");
const loadConsult = () => import("@/components/common/ConsultModal");
const CartDrawer = dynamic(loadCart);
const ConsultModal = dynamic(loadConsult);

/** true khi trang đã tải xong + trình duyệt rảnh (tối đa ~1,5s sau load) */
export function useAfterLoad() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idleId;
    const go = () => {
      idleId =
        "requestIdleCallback" in window
          ? requestIdleCallback(() => setReady(true), { timeout: 1500 })
          : setTimeout(() => setReady(true), 200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idleId && "cancelIdleCallback" in window) cancelIdleCallback(idleId);
    };
  }, []);
  return [ready, setReady];
}

export function LazyCartDrawer(props) {
  const [ready, setReady] = useAfterLoad();
  const { open } = useCart();
  // giỏ được mở (thêm sản phẩm / bấm icon giỏ) trước khi kịp tải → tải ngay, gắn xong tự hiện (open = true)
  useEffect(() => {
    if (open && !ready) loadCart().then(() => setReady(true));
  }, [open, ready, setReady]);
  return ready ? <CartDrawer {...props} /> : null;
}

export function LazyConsultModal(props) {
  const [ready, setReady] = useAfterLoad();
  const pending = useRef(null);
  // bấm nút "Tư vấn" ([data-consult]) trước khi popup kịp tải → giữ lần bấm, tải xong thì bấm lại hộ khách
  useEffect(() => {
    if (ready) return;
    const onClick = (e) => {
      const el = e.target.closest?.("[data-consult]");
      if (!el) return;
      e.preventDefault();
      pending.current = el;
      loadConsult().then(() => setReady(true));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ready, setReady]);
  useEffect(() => {
    if (!ready || !pending.current) return;
    const el = pending.current;
    pending.current = null;
    // đợi popup gắn xong trình nghe sự kiện (sau 1 khung hình) rồi mới bấm lại
    const id = requestAnimationFrame(() => requestAnimationFrame(() => el.click()));
    return () => cancelAnimationFrame(id);
  }, [ready]);
  return ready ? <ConsultModal {...props} /> : null;
}
