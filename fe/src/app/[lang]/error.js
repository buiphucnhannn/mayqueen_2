"use client";

import SiteErrorView from "@/components/common/SiteErrorView";

/** Lỗi bất ngờ khi render một trang của site — giữ header/footer, cho thử lại (song ngữ theo URL) */
export default function SiteError({ reset }) {
  return <SiteErrorView embedded reset={reset} />;
}
