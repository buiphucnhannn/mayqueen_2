"use client";

import useReveal from "@/hooks/useReveal";

// Đặt 1 lần trong layout: tự kích hoạt hiệu ứng cho mọi phần tử có class .reveal / .split
export default function Reveal() {
  useReveal();
  return null;
}
