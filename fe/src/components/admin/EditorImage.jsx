"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ảnh trong khung soạn thảo: hiển thị gọn (không quá cao), căn giữa; rê chuột / chọn ảnh → nút X để xóa.
 * Ảnh dán từ máy hiện ngay (blob), tải lên Cloudinary khi bấm Lưu bài.
 * Chỉ ảnh hưởng cách hiện trong trình soạn thảo — HTML lưu vẫn là <img> chuẩn.
 */
function ImageView({ node, deleteNode, selected }) {
  const { src, alt } = node.attrs;
  return (
    <NodeViewWrapper
      className={cn("rich-img group relative mx-auto w-fit max-w-full", selected && "is-selected")}
      data-drag-handle
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trong trình soạn thảo (có thể là blob URL) */}
      <img src={src} alt={alt ?? ""} draggable={false} />
      <button
        type="button"
        contentEditable={false}
        onMouseDown={(e) => e.preventDefault()} // không làm mất vùng chọn trong khung soạn thảo
        onClick={deleteNode}
        aria-label="Xóa ảnh"
        title="Xóa ảnh"
        className={cn(
          "absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/65 text-white shadow-md backdrop-blur transition hover:bg-red-600",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </NodeViewWrapper>
  );
}

export const EditorImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
}).configure({ allowBase64: false });
