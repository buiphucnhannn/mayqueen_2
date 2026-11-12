import { cn } from "@/lib/utils";

/**
 * Dải chạy ngang vô tận (CSS thuần). Nội dung được nhân đôi để vòng lặp liền mạch.
 * reverse: chạy ngược chiều; pauseOnHover: dừng khi rê chuột.
 */
export default function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  className,
  trackClassName,
}) {
  return (
    <div className={cn("overflow-hidden", pauseOnHover && "marquee-pause", className)}>
      <div
        className={cn(
          "marquee-track flex w-max",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          trackClassName,
        )}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
