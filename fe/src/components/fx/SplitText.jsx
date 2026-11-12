import { cn, keepPhrases, noOrphan } from "@/lib/utils";

/**
 * Tách tiêu đề thành từng từ để hiện dần từng từ (useReveal chạy animation khi cuộn tới).
 * - text: phần chính; accent: phần nhấn (in nghiêng, màu khác) ở cuối — tùy chọn.
 */
export default function SplitText({
  text,
  accent,
  accentClass = "italic text-sage-600",
  as: Tag = "h2",
  className,
  step = 55,
  baseDelay = 0,
  breakBeforeAccent = false,
}) {
  let i = 0;
  const render = (str, extra) =>
    noOrphan(keepPhrases(str))
      .split(" ")
      .flatMap((word, wi, words) => [
        <span key={`${wi}-${word}`} className="whitespace-nowrap">
          <span className={cn("split-unit", extra)} style={{ "--i": i++ }}>
            {word}
          </span>
        </span>,
        wi < words.length - 1 ? " " : null,
      ]);

  return (
    <Tag
      className={cn("split", className)}
      style={{ "--step": `${step}ms`, "--base": `${baseDelay}ms` }}
    >
      {render(text)}
      {accent && (
        <>
          {breakBeforeAccent ? <br /> : " "}
          {render(accent, accentClass)}
        </>
      )}
    </Tag>
  );
}
