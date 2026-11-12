import { cn } from "@/lib/utils";

/**
 * Tiêu đề khối kiểu Kobler: serif IN HOA 2 dòng — dòng 1 màu chữ, dòng 2 màu nhấn (sage).
 * light: dùng trên nền tối. as: thẻ tiêu đề (h1/h2).
 * aside: nút đặt bên phải, căn ĐÚNG GIỮA chiều cao tiêu đề (desktop); mobile xuống dưới tiêu đề.
 */
export default function LuxTitle({
  eyebrow,
  title,
  accent,
  text,
  align = "left",
  light = false,
  as: Tag = "h2",
  size = "md",
  className,
  textClassName, // tùy chỉnh đoạn mô tả (VD nới độ rộng để nằm 1 dòng)
  aside,
  children,
}) {
  const heading = (
    <Tag
      className={cn(
        "reveal h-lux",
        size === "lg" && "text-[34px] sm:text-[46px] lg:text-[58px]",
        size === "md" && "text-[30px] sm:text-[38px] lg:text-[46px]",
        size === "sm" && "text-[26px] sm:text-[32px] lg:text-[38px]",
        light && "text-pearl [&_.accent]:text-sage-300",
      )}
    >
      {title}
      {accent && <span className="accent">{accent}</span>}
    </Tag>
  );

  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "reveal mb-4 text-[11px] font-semibold tracking-[0.3em] uppercase",
            light ? "text-sage-300" : "text-sage-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      {aside ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {heading}
          <div className="reveal shrink-0">{aside}</div>
        </div>
      ) : (
        heading
      )}
      {text && (
        <p
          className={cn(
            "reveal mt-4 max-w-xl text-[15px] leading-relaxed",
            align === "center" && "mx-auto",
            light ? "text-pearl/75" : "text-ink-soft",
            textClassName,
          )}
          style={{ "--reveal-delay": "120ms" }}
        >
          {text}
        </p>
      )}
      {children}
    </div>
  );
}
