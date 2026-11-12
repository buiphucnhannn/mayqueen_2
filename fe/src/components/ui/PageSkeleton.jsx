import Container from "@/components/ui/Container";

/**
 * Khung chờ cho các trang [slug] khi nội dung đang stream (fallback của <Suspense>).
 * Mọi slug đều prerender sẵn nên khi mở trực tiếp sẽ không thấy; chỉ thoáng hiện lúc chuyển trang.
 * variant: "product" (ảnh + cột thông tin) | "article" (tiêu đề + ảnh bìa) | "text" (trang chữ)
 */
const block = "animate-pulse rounded-md bg-sage-100/70";

export default function PageSkeleton({ variant = "text" }) {
  if (variant === "product")
    return (
      <Container
        wide
        className="grid gap-10 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
        aria-hidden="true"
      >
        <div className={`${block} aspect-square`} />
        <div className="space-y-4">
          <div className={`${block} h-3 w-40`} />
          <div className={`${block} h-10 w-3/4`} />
          <div className={`${block} h-4 w-1/2`} />
          <div className={`${block} h-24 w-full`} />
          <div className={`${block} h-16 w-full`} />
          <div className={`${block} h-16 w-full`} />
          <div className={`${block} h-12 w-full rounded-full`} />
        </div>
      </Container>
    );

  if (variant === "article")
    return (
      <div aria-hidden="true">
        <Container className="flex max-w-4xl flex-col items-center gap-4 pt-32 pb-14">
          <div className={`${block} h-5 w-32 rounded-full`} />
          <div className={`${block} h-10 w-4/5`} />
          <div className={`${block} h-4 w-48`} />
        </Container>
        <Container wide>
          <div className={`${block} aspect-[21/9] w-full`} />
        </Container>
      </div>
    );

  return (
    <Container wide className="space-y-4 pt-32 pb-14" aria-hidden="true">
      <div className={`${block} h-3 w-32`} />
      <div className={`${block} h-10 w-1/2`} />
      <div className={`${block} h-32 w-full max-w-3xl`} />
    </Container>
  );
}
