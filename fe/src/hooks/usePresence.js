"use client";

import { useEffect, useState } from "react";

/**
 * Giữ popup trong DOM thêm `ms` sau khi đóng để kịp chạy hiệu ứng đóng (mờ dần + trượt xuống).
 * Trả về { mounted, closing }: render khi mounted; closing = true trong lúc đang đóng.
 */
export function usePresence(open, ms = 320) {
  const [mounted, setMounted] = useState(open);
  // mở: gắn ngay trong lúc render (không cần chờ effect)
  if (open && !mounted) setMounted(true);
  const closing = mounted && !open;

  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(id);
  }, [closing, ms]);

  return { mounted, closing };
}
