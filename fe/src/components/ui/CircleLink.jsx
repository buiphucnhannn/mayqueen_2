import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nút kiểu Kobler: chữ IN HOA + vòng tròn viền mảnh có mũi tên (vòng tô đầy khi hover).
 * Có href → link; không có → <button> (vd. data-consult mở popup tư vấn).
 */
export default function CircleLink({ href, light = false, className, children, ...props }) {
  const cls = cn("group link-circle", light ? "text-pearl" : "text-forest", className);
  const inner = (
    <>
      <span>{children}</span>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full border transition-colors duration-300",
          light
            ? "border-pearl/60 group-hover:border-pearl group-hover:bg-pearl group-hover:text-forest"
            : "border-forest/40 group-hover:border-forest group-hover:bg-forest group-hover:text-pearl",
        )}
      >
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} {...props}>
        {inner}
      </Link>
    );
  return (
    <button type="button" className={cls} {...props}>
      {inner}
    </button>
  );
}
