"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import ErrorScreen from "@/components/ui/ErrorScreen";
import { siteConfig } from "@/config/site";

const COPY = {
  vi: {
    eyebrow: "Đã có lỗi xảy ra",
    title: "Trang tạm thời gặp sự cố",
    text: [
      "Một lỗi bất ngờ vừa xảy ra, bạn vui lòng thử lại.",
      `Cần đặt hàng gấp? Gọi hotline ${siteConfig.phone}.`,
    ],
    retry: "Thử lại",
    retrying: "Đang tải lại…",
    home: "Về trang chủ",
    homeHref: "/",
    footer: "Mayqueen Slim - B.O.T Việt Nam",
  },
  en: {
    eyebrow: "Something went wrong",
    title: "This page is temporarily unavailable",
    text: [
      "An unexpected error occurred, please try again.",
      `Need help with an order? Call ${siteConfig.phone}.`,
    ],
    retry: "Try again",
    retrying: "Reloading…",
    home: "Back to home",
    homeHref: "/en",
    footer: "Mayqueen Slim - B.O.T Vietnam",
  },
};

/**
 * Màn lỗi 500 song ngữ (theo URL đang mở) dùng cho app/[lang]/error.js và app/global-error.js.
 * "Thử lại": router.refresh() lấy lại dữ liệu từ server (lỗi do backend chập chờn) rồi reset() vẽ lại trang.
 */
export default function SiteErrorView({ reset, embedded = false }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lang = usePathname()?.startsWith("/en") ? "en" : "vi"; // dùng được cả khi render ở server
  const t = COPY[lang];
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset?.();
    });

  return (
    <ErrorScreen
      embedded={embedded}
      code="500"
      eyebrow={t.eyebrow}
      title={t.title}
      text={t.text}
      homeHref={t.homeHref}
      footer={t.footer}
      actions={[{ href: t.homeHref, label: t.home }]}
    >
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="bg-pearl text-forest hover:bg-sage-100 inline-flex h-12 items-center justify-center rounded-full px-7 text-xs font-semibold tracking-[0.16em] uppercase transition-colors disabled:opacity-60"
      >
        {pending ? t.retrying : t.retry}
      </button>
    </ErrorScreen>
  );
}
