"use client";

import { useEffect } from "react";

export const LANG_COOKIE = "mq_lang";

/**
 * Ghi nhớ ngôn ngữ khách đang xem (cookie 1 năm) — mở trang bất kỳ của bản tiếng Việt / tiếng Anh, hoặc bấm
 * nút VI / EN, là cập nhật. Proxy chỉ dùng cookie này cho trang 404 KHÔNG rõ ngôn ngữ (vd. /abc) để hiện đúng
 * ngôn ngữ khách đã chọn. Trang thật KHÔNG bị tự chuyển hướng theo cookie (Google cần vào được cả 2 bản).
 * Ghi ở trình duyệt (không Set-Cookie từ server) → trang tĩnh vẫn được cache bình thường.
 */
export default function RememberLang({ lang }) {
  useEffect(() => {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  }, [lang]);
  return null;
}
