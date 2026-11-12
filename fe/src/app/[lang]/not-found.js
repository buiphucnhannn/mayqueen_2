import { Suspense } from "react";
import LangNotFound from "@/components/common/LangNotFound";

/**
 * 404 phát sinh khi đang dùng site (notFound() trong trang). Đường dẫn lạ gõ trực tiếp đã được proxy
 * đưa vào [...rest]/page.js (HTML đầy đủ + mã 404).
 * not-found không nhận params → đọc ngôn ngữ từ URL ở trình duyệt; đọc URL phải nằm trong <Suspense>
 * (Cache Components). Phần chờ để TRỐNG (không chữ): Next nhúng sẵn phần này vào mọi trang — có chữ
 * tiếng Việt thì view-source trang tiếng Anh cũng chứa câu tiếng Việt.
 */
export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" aria-busy="true" />}>
      <LangNotFound />
    </Suspense>
  );
}
