"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

/** Lỗi bất ngờ khi render khu quản trị / đăng nhập */
export default function SystemError({ reset }) {
  return (
    <ErrorScreen
      code="500"
      eyebrow="Đã có lỗi xảy ra"
      title="Hệ thống gặp sự cố"
      text="Một lỗi bất ngờ vừa xảy ra. Bạn thử tải lại, nếu vẫn lỗi vui lòng quay lại sau ít phút."
      actions={[{ href: "/", label: "Về trang chủ" }]}
    >
      <button
        type="button"
        onClick={reset}
        className="bg-pearl text-forest hover:bg-sage-100 inline-flex h-12 items-center justify-center rounded-full px-7 text-xs font-semibold tracking-[0.16em] uppercase transition-colors"
      >
        Thử lại
      </button>
    </ErrorScreen>
  );
}
