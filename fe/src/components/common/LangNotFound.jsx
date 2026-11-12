"use client";

import { usePathname } from "next/navigation";
import NotFoundView, { NOT_FOUND_COPY } from "./NotFoundView";

/** 404 theo ngôn ngữ của URL đang xem (/en/... = tiếng Anh) — dùng trong [lang]/not-found.js */
export default function LangNotFound() {
  const lang = /^\/en(\/|$)/.test(usePathname() ?? "") ? "en" : "vi";
  return (
    <>
      <title>{NOT_FOUND_COPY[lang].tab}</title>
      <NotFoundView lang={lang} embedded />
    </>
  );
}
