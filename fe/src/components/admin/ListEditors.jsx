"use client";

import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton, LocalizedInput, emptyLoc } from "./ui";

/** Thao tác chung cho danh sách có thứ tự */
export const rows = {
  update: (list, i, patch) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)),
  set: (list, i, value) => list.map((x, j) => (j === i ? value : x)),
  remove: (list, i) => list.filter((_, j) => j !== i),
  /** Đưa phần tử ở vị trí from sang vị trí to (kéo-thả) */
  moveTo: (list, from, to) => {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  },
};

/**
 * Kéo-thả đổi thứ tự dòng trong form — chỉ kéo được khi nắm biểu tượng ⋮⋮ (DragHandle),
 * để bôi đen / sửa chữ trong ô nhập vẫn bình thường.
 *   const sort = useSortable(list, onChange);
 *   <div {...sort.row(i)} className={sort.rowClass(i)}> ... <DragHandle {...sort.handle(i)} />
 */
export function useSortable(list, onChange) {
  const [armed, setArmed] = useState(null); // dòng đang được nắm ở tay kéo
  const [drag, setDrag] = useState(null); // { from, over }
  const reset = () => {
    setArmed(null);
    setDrag(null);
  };

  return {
    row: (i) => ({
      draggable: armed === i,
      onDragStart: (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(i)); // Firefox cần có dữ liệu mới cho kéo
        setDrag({ from: i, over: i });
      },
      onDragOver: (e) => {
        if (!drag) return;
        e.preventDefault();
        if (drag.over !== i) setDrag({ ...drag, over: i });
      },
      onDrop: (e) => {
        if (!drag) return;
        e.preventDefault();
        if (drag.from !== i) onChange(rows.moveTo(list, drag.from, i));
        reset();
      },
      onDragEnd: reset,
    }),
    // dòng đang kéo mờ đi; vạch xanh báo chỗ sẽ thả (trên / dưới dòng đích)
    rowClass: (i) =>
      cn(
        "rounded-xl transition-[opacity,box-shadow]",
        drag?.from === i && "opacity-40",
        drag &&
          drag.over === i &&
          drag.from !== i &&
          (drag.from < i
            ? "shadow-[0_3px_0_var(--color-sage-500)]"
            : "shadow-[0_-3px_0_var(--color-sage-500)]"),
      ),
    handle: (i) => ({
      onPointerDown: () => setArmed(i),
      onPointerUp: () => !drag && setArmed(null),
    }),
  };
}

/** Tay nắm kéo ⋮⋮ */
export function DragHandle({ className, ...props }) {
  return (
    <span
      {...props}
      title="Kéo để đổi vị trí"
      aria-label="Kéo để đổi vị trí"
      className={cn(
        "text-ink-muted hover:bg-sage-50 hover:text-forest grid size-8 shrink-0 cursor-grab place-items-center rounded-lg transition-colors active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </span>
  );
}

/** Tay nắm kéo + nút xóa cho 1 dòng */
export function RowActions({ handle, onRemove }) {
  return (
    <span className="flex shrink-0 items-center">
      <DragHandle {...handle} />
      <IconButton label="Xóa dòng" onClick={onRemove} className="hover:text-red-600">
        <X className="size-4" />
      </IconButton>
    </span>
  );
}

/** Danh sách chuỗi song ngữ (công dụng, cách dùng...) */
export function LocalizedList({ value, onChange, placeholder, addLabel = "Thêm dòng", multiline }) {
  const sort = useSortable(value, onChange);
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} {...sort.row(i)} className={cn("flex items-start gap-2", sort.rowClass(i))}>
          <span className="text-ink-muted mt-2.5 w-5 shrink-0 text-right text-xs tabular-nums">
            {i + 1}.
          </span>
          <div className="flex-1">
            <LocalizedInput
              value={item}
              multiline={multiline}
              rows={2}
              onChange={(v) => onChange(rows.set(value, i, v))}
              placeholder={placeholder}
            />
          </div>
          <RowActions handle={sort.handle(i)} onRemove={() => onChange(rows.remove(value, i))} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, emptyLoc()])}>
        <Plus className="size-4" aria-hidden="true" /> {addLabel}
      </Button>
    </div>
  );
}
