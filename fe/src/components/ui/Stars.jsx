import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stars({ value = 5, className, size = "size-3.5" }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            size,
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-forest/15",
          )}
        />
      ))}
    </span>
  );
}
