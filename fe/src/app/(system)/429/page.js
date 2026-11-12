import { Suspense } from "react";
import ErrorScreen from "@/components/ui/ErrorScreen";
import { safeNext } from "@/lib/safe-next";
import RetryButton from "./RetryButton";

export const metadata = { title: "Thao tác quá nhanh" };

const copy = {
  code: "429",
  eyebrow: "Tạm dừng một chút",
  title: "Bạn thao tác hơi nhanh",
  text: [
    "Để bảo vệ tài khoản, hệ thống tạm giới hạn yêu cầu.",
    "Vui lòng chờ trong giây lát rồi thử lại.",
  ],
  actions: [{ href: "/", label: "Về trang chủ" }],
};

async function Retry({ searchParams }) {
  const { next, retry } = await searchParams;
  return <RetryButton seconds={retry} href={safeNext(next)} />;
}

export default function TooManyRequestsPage({ searchParams }) {
  return (
    <ErrorScreen {...copy}>
      <Suspense fallback={<RetryButton seconds={60} href="/admin" />}>
        <Retry searchParams={searchParams} />
      </Suspense>
    </ErrorScreen>
  );
}
