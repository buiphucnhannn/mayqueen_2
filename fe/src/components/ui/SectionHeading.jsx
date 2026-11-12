import SplitText from "@/components/fx/SplitText";
import { cn } from "@/lib/utils";

// Tiêu đề section chuẩn: eyebrow + tiêu đề serif hiện từng chữ + mô tả. Cỡ chữ vừa phải (kiểu The Beauty Chef).
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  text,
  align = "center",
  light = false,
  className,
  children,
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("reveal eyebrow", light && "text-leaf")}>{eyebrow}</p>}
      <SplitText
        text={title}
        accent={accent}
        accentClass={light ? "italic text-leaf" : "italic text-sage-600"}
        className={cn(
          "h-display mt-3 text-[28px] sm:text-[34px] lg:text-[40px]",
          light && "text-pearl",
        )}
      />
      {text && (
        <p
          className={cn(
            "reveal mt-3 text-[15px] leading-relaxed",
            light ? "text-pearl/75" : "text-ink-soft",
          )}
          style={{ "--reveal-delay": "150ms" }}
        >
          {text}
        </p>
      )}
      {children}
    </div>
  );
}
