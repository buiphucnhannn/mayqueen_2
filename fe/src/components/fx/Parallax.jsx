"use client";

import { useEffect, useRef } from "react";
import { documentTop, subscribeScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * Parallax nhẹ theo vị trí trong viewport.
 * speed > 0: phần tử trôi chậm hơn trang (cảm giác chiều sâu); speed < 0: trôi ngược chiều.
 *
 * Đo vị trí 1 lần (offsetTop — không bị transform của chính nó làm sai lệch), mỗi frame chỉ
 * tính toán + ghi transform → không đọc layout khi cuộn, không rung.
 */
export default function Parallax({ speed = 0.12, className, children, as: Tag = "div", ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    // Bỏ qua trên màn cảm ứng: trình duyệt cuộn native trên luồng
    // riêng nên parallax bằng JS luôn trễ nhịp → rung nhẹ trên điện thoại.
    const skip = window.matchMedia("(pointer: coarse)").matches;
    if (!el || skip) return;

    let top = 0;
    let height = 0;
    let vh = 0;
    let last = null;

    const measure = () => {
      top = documentTop(el);
      height = el.offsetHeight;
      vh = window.innerHeight;
    };
    const onScroll = (y) => {
      const rectTop = top - y;
      if (rectTop + height < -300 || rectTop > vh + 300) return; // ngoài màn hình: bỏ qua
      const offset = Math.round(-(rectTop + height / 2 - vh / 2) * speed * 10) / 10;
      if (offset === last) return;
      last = offset;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };
    return subscribeScroll(onScroll, measure);
  }, [speed]);

  return (
    <Tag ref={ref} className={cn("will-change-transform", className)} {...rest}>
      {children}
    </Tag>
  );
}
