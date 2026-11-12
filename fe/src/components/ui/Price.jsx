import { cn, discountPercent, formatPrice } from "@/lib/utils";

export default function Price({
  price,
  compareAt,
  lang,
  className,
  size = "md",
  showBadge = false,
}) {
  const off = discountPercent(price, compareAt);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("text-forest font-semibold", size === "lg" ? "text-2xl" : "text-base")}>
        {formatPrice(price, lang)}
      </span>
      {compareAt && (
        <span
          className={cn("text-ink-muted line-through", size === "lg" ? "text-base" : "text-sm")}
        >
          {formatPrice(compareAt, lang)}
        </span>
      )}
      {showBadge && off > 0 && (
        <span className="bg-leaf-soft text-sage-800 rounded-full px-2 py-0.5 text-xs font-semibold">
          -{off}%
        </span>
      )}
    </span>
  );
}
