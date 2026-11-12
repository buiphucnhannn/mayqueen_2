"use client";

import { usePathname } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = {
  vi: { group: "Số lượng", dec: "Giảm số lượng", inc: "Tăng số lượng", remove: "Bỏ khỏi giỏ" },
  en: { group: "Quantity", dec: "Decrease quantity", inc: "Increase quantity", remove: "Remove" },
};

export default function QtyStepper({ value, onChange, min = 1, size = "md", className, label }) {
  // trình đọc màn hình đọc đúng ngôn ngữ trang ("Giảm số lượng" thay vì đọc ký hiệu "−")
  const t = LABELS[usePathname()?.startsWith("/en") ? "en" : "vi"];
  const btn = cn(
    "grid place-items-center text-forest transition hover:bg-sage-100 disabled:opacity-30",
    size === "sm" ? "size-8" : "size-11",
  );
  return (
    <div
      role="group"
      aria-label={label ? `${t.group}: ${label}` : t.group}
      className={cn(
        "border-forest/15 inline-flex items-center rounded-full border bg-white",
        className,
      )}
    >
      <button
        type="button"
        className={cn(btn, "rounded-l-full")}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={min < 1 && value - 1 < 1 ? t.remove : t.dec}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "text-center font-semibold tabular-nums",
          size === "sm" ? "w-7 text-sm" : "w-9",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(btn, "rounded-r-full")}
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        aria-label={t.inc}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
