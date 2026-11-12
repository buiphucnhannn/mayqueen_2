"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mục đóng/mở (accordion) có hiệu ứng: chiều cao trượt mượt (grid-rows 0fr ↔ 1fr) + nội dung mờ dần.
 * Thay cho <details> (thẻ gốc mở/đóng giật cục, không có hiệu ứng).
 * - summary: nội dung dòng tiêu đề; icon: biểu tượng bên phải — dùng class group-data-[open=true]:… để đổi
 *   theo trạng thái (vd. xoay dấu +). Dùng được từ Server Component (không cần truyền hàm).
 */
export default function Disclosure({
  summary,
  icon,
  defaultOpen = false,
  className,
  buttonClassName,
  panelClassName,
  style,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={cn("group", className)} style={style} data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between text-left",
          buttonClassName,
        )}
      >
        {summary}
        {icon}
      </button>
      <div
        id={id}
        role="region"
        className={cn(
          "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          inert={!open}
          className={cn(
            "min-h-0 overflow-hidden transition-[opacity,transform] duration-500 ease-out",
            open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
          )}
        >
          <div className={panelClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}
