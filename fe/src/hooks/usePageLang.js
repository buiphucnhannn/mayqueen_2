"use client";

import { usePathname } from "next/navigation";

/** Ngôn ngữ trang đang xem theo URL ("/en…" → "en", còn lại "vi") — cho component dùng chung không nhận prop lang */
export function usePageLang() {
  return usePathname()?.startsWith("/en") ? "en" : "vi";
}

/** Nhãn nút điều hướng (trình đọc màn hình đọc đúng ngôn ngữ trang) */
export const NAV_LABELS = {
  vi: {
    prev: "Trước",
    next: "Tiếp theo",
    prevImage: "Ảnh trước",
    nextImage: "Ảnh tiếp theo",
    close: "Đóng",
  },
  en: {
    prev: "Previous",
    next: "Next",
    prevImage: "Previous image",
    nextImage: "Next image",
    close: "Close",
  },
};
