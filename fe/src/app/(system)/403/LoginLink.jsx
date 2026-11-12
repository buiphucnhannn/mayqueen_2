"use client";

import { useEffect, useState } from "react";
import { safeNext } from "@/lib/safe-next";

/**
 * Nút "Đăng nhập" của trang 403. Proxy trả trang này NGAY TẠI URL đang vào (VD /admin/don-hang),
 * nên đọc trang cần quay lại từ thanh địa chỉ ở trình duyệt — không cần Suspense / searchParams phía server
 * (trước đây Suspense làm trang vẽ 2 lần: bản tạm rồi bản thật → "giật").
 * Chữ và kích thước nút không đổi khi cập nhật href → không nhảy bố cục.
 */
// thẻ <a> thường: trang lỗi có thể được proxy trả ngay tại URL khác → <Link> của Next không chuyển trang được
export default function LoginLink({ className, children }) {
  const [next, setNext] = useState("/admin");
  useEffect(() => {
    const { pathname, search } = window.location;
    const from = new URLSearchParams(search).get("from"); // khi mở thẳng /403?from=...
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL chỉ đọc được ở trình duyệt, sau khi mount
    setNext(safeNext(pathname.startsWith("/admin") ? pathname + search : from));
  }, []);
  return (
    <a href={`/login?next=${encodeURIComponent(next)}`} className={className}>
      {children}
    </a>
  );
}
