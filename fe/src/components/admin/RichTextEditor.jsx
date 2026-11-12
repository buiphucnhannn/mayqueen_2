"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { LineHeight } from "./line-height";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table2,
  UnfoldVertical,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorImage } from "./EditorImage";
import { UrlImageInput } from "./ImageUpload";
import { isLocal, stageFile } from "./pending-images";
import { useToast } from "./ui";

/* Màu chữ / tô nền theo bảng màu thương hiệu (giữ bài viết đồng bộ với website) */
const TEXT_COLORS = [
  ["Mặc định", null],
  ["Xanh rêu", "#1e3a28"],
  ["Xanh lá", "#5f7d41"],
  ["Xanh lá tươi", "#8dc63f"],
  ["Nâu đất", "#8a5a2b"],
  ["Đỏ", "#c0392b"],
  ["Xám", "#7b877e"],
];
const HIGHLIGHTS = [
  ["Không tô", null],
  ["Vàng nhạt", "#fdf3c4"],
  ["Xanh nhạt", "#e7eedb"],
  ["Hồng nhạt", "#fbe2df"],
  ["Xám nhạt", "#efe9da"],
];

/* Giãn dòng (null = mặc định của website: 1.8 cho đoạn văn) */
const LINE_HEIGHTS = [
  ["Mặc định", null],
  ["1.0", "1"],
  ["1.15", "1.15"],
  ["1.5", "1.5"],
  ["2.0", "2"],
  ["2.5", "2.5"],
  ["3.0", "3"],
];

function Btn({ title, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // giữ vùng chọn trong khung soạn thảo
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors disabled:opacity-30",
        active ? "bg-forest text-white" : "text-ink-soft hover:bg-forest/8 hover:text-forest",
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="bg-forest/10 mx-1 h-5 w-px" aria-hidden="true" />;

/** Nút mở bảng chọn nhỏ (màu chữ, tô nền, chèn liên kết) */
function Popover({ title, icon, active, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <span ref={ref} className="relative">
      <Btn title={title} active={active || open} onClick={() => setOpen((o) => !o)}>
        {icon}
      </Btn>
      {open && (
        <span className="bg-pearl border-forest/10 absolute top-9 left-0 z-20 rounded-xl border p-2 shadow-lg">
          {children(() => setOpen(false))}
        </span>
      )}
    </span>
  );
}

function Swatches({ items, onPick }) {
  return (
    <span className="grid w-44 grid-cols-4 gap-1.5">
      {items.map(([label, color]) => (
        <button
          key={label}
          type="button"
          title={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(color)}
          className="border-forest/15 hover:ring-sage-400 grid size-9 place-items-center rounded-lg border text-[10px] hover:ring-2"
          style={{ background: color ?? "transparent" }}
        >
          {!color && "∅"}
        </button>
      ))}
    </span>
  );
}

function LinkForm({ editor, close }) {
  const [url, setUrl] = useState(editor.getAttributes("link").href ?? "");
  const apply = (e) => {
    e.preventDefault();
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!href) chain.unsetLink().run();
    else
      chain
        .setLink({ href: /^(https?:|mailto:|tel:|\/)/.test(href) ? href : `https://${href}` })
        .run();
    close();
  };
  return (
    <form onSubmit={apply} className="flex w-72 gap-1.5">
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://… (để trống = gỡ liên kết)"
        className="border-forest/15 focus:border-sage-500 min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none"
      />
      <button type="submit" className="bg-forest rounded-lg px-3 text-xs font-semibold text-white">
        OK
      </button>
    </form>
  );
}

function Toolbar({ editor, onPickImages, onInsertUrl }) {
  // chỉ vẽ lại thanh công cụ khi trạng thái định dạng đổi (không phải mỗi phím gõ)
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      table: e.isActive("table"),
      color: !!e.getAttributes("textStyle").color,
      highlight: e.isActive("highlight"),
      lineHeight:
        e.getAttributes("paragraph").lineHeight ?? e.getAttributes("heading").lineHeight ?? null,
      align: ["center", "right", "justify"].find((a) => e.isActive({ textAlign: a })) ?? "left",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  const block = s.h2 ? "h2" : s.h3 ? "h3" : "p";

  return (
    // điện thoại: dính ngay dưới thanh trên cùng của Admin (cao 64px = top-16), máy tính: sát mép trên
    <div className="border-forest/10 bg-pearl/95 sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b px-2 py-1.5 backdrop-blur lg:top-0">
      <Btn title="Hoàn tác (Ctrl+Z)" disabled={!s.canUndo} onClick={() => c().undo().run()}>
        <Undo2 className="size-4" />
      </Btn>
      <Btn title="Làm lại (Ctrl+Y)" disabled={!s.canRedo} onClick={() => c().redo().run()}>
        <Redo2 className="size-4" />
      </Btn>
      <Sep />
      <select
        aria-label="Kiểu đoạn"
        value={block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") c().setParagraph().run();
          else
            c()
              .setHeading({ level: v === "h2" ? 2 : 3 })
              .run();
        }}
        className="text-ink hover:bg-forest/5 h-8 rounded-md bg-transparent px-1.5 text-xs font-semibold outline-none"
      >
        <option value="p">Đoạn văn</option>
        <option value="h2">Tiêu đề lớn</option>
        <option value="h3">Tiêu đề nhỏ</option>
      </select>
      <Sep />
      <Btn title="In đậm (Ctrl+B)" active={s.bold} onClick={() => c().toggleBold().run()}>
        <Bold className="size-4" />
      </Btn>
      <Btn title="In nghiêng (Ctrl+I)" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <Italic className="size-4" />
      </Btn>
      <Btn
        title="Gạch chân (Ctrl+U)"
        active={s.underline}
        onClick={() => c().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Btn>
      <Btn title="Gạch ngang" active={s.strike} onClick={() => c().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </Btn>
      <Popover title="Màu chữ" active={s.color} icon={<Palette className="size-4" />}>
        {(close) => (
          <Swatches
            items={TEXT_COLORS}
            onPick={(color) => {
              if (color) c().setColor(color).run();
              else c().unsetColor().run();
              close();
            }}
          />
        )}
      </Popover>
      <Popover title="Tô nền chữ" active={s.highlight} icon={<Highlighter className="size-4" />}>
        {(close) => (
          <Swatches
            items={HIGHLIGHTS}
            onPick={(color) => {
              if (color) c().setHighlight({ color }).run();
              else c().unsetHighlight().run();
              close();
            }}
          />
        )}
      </Popover>
      <Sep />
      {[
        ["left", "Căn trái", AlignLeft],
        ["center", "Căn giữa", AlignCenter],
        ["right", "Căn phải", AlignRight],
        ["justify", "Căn đều 2 bên", AlignJustify],
      ].map(([a, title, Icon]) => (
        <Btn key={a} title={title} active={s.align === a} onClick={() => c().setTextAlign(a).run()}>
          <Icon className="size-4" />
        </Btn>
      ))}
      <Popover
        title="Giãn dòng"
        active={!!s.lineHeight}
        icon={<UnfoldVertical className="size-4" />}
      >
        {(close) => (
          <span className="flex w-36 flex-col text-xs font-medium">
            <span className="text-ink-muted px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Giãn dòng
            </span>
            {LINE_HEIGHTS.map(([label, value]) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (value) c().setLineHeight(value).run();
                  else c().unsetLineHeight().run();
                  close();
                }}
                className={cn(
                  "hover:bg-sage-50 flex items-center justify-between rounded-md px-2.5 py-1.5 text-left",
                  s.lineHeight === value && "text-forest bg-sage-50 font-semibold",
                )}
              >
                {label}
                {s.lineHeight === value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </span>
        )}
      </Popover>
      <Sep />
      <Btn title="Danh sách chấm" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <List className="size-4" />
      </Btn>
      <Btn title="Danh sách số" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </Btn>
      <Btn
        title="Khung nổi bật / trích dẫn"
        active={s.quote}
        onClick={() => c().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </Btn>
      <Btn title="Đường kẻ ngang" onClick={() => c().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </Btn>
      <Sep />
      <Popover title="Chèn / sửa liên kết" active={s.link} icon={<Link2 className="size-4" />}>
        {(close) => <LinkForm editor={editor} close={close} />}
      </Popover>
      <Popover
        title="Chèn ảnh — từ máy, bằng link, hoặc dán / kéo ảnh thẳng vào bài"
        icon={<ImagePlus className="size-4" />}
      >
        {(close) => (
          <span className="flex w-72 flex-col gap-2.5 p-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                close();
                onPickImages();
              }}
              className="border-forest/15 hover:border-sage-500 hover:bg-sage-50 text-forest flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
            >
              <ImagePlus className="size-4" aria-hidden="true" /> Tải ảnh từ máy
            </button>
            <span className="text-ink-muted text-[10.5px] font-semibold tracking-[0.1em] uppercase">
              Hoặc dán link ảnh
            </span>
            <UrlImageInput
              compact
              onAdd={(img) => {
                close();
                onInsertUrl(img.url);
              }}
            />
          </span>
        )}
      </Popover>
      <Popover title="Bảng" active={s.table} icon={<Table2 className="size-4" />}>
        {(close) => (
          <span className="flex w-48 flex-col text-xs font-medium">
            {[
              [
                "Chèn bảng 3×3",
                () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
                true,
              ],
              ["Thêm hàng bên dưới", () => c().addRowAfter().run(), s.table],
              ["Thêm cột bên phải", () => c().addColumnAfter().run(), s.table],
              ["Xóa hàng", () => c().deleteRow().run(), s.table],
              ["Xóa cột", () => c().deleteColumn().run(), s.table],
              ["Xóa bảng", () => c().deleteTable().run(), s.table],
            ].map(([label, run, enabled]) => (
              <button
                key={label}
                type="button"
                disabled={!enabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  run();
                  close();
                }}
                className="hover:bg-sage-50 rounded-md px-2.5 py-1.5 text-left disabled:opacity-35"
              >
                {label}
              </button>
            ))}
          </span>
        )}
      </Popover>
      <Sep />
      <Btn
        title="Xóa định dạng"
        onClick={() => c().unsetAllMarks().clearNodes().unsetTextAlign().unsetLineHeight().run()}
      >
        <RemoveFormatting className="size-4" />
      </Btn>
    </div>
  );
}

const isImage = (f) => f.type.startsWith("image/");

/**
 * Trình soạn thảo bài viết (kiểu Word) — 1 khung duy nhất, xuất HTML.
 * Ảnh: bấm nút, dán (Ctrl+V) hoặc kéo-thả vào bài → chèn NGAY bằng ảnh trên máy (nén ngầm); chỉ tải lên
 * Cloudinary khi bấm Lưu bài (ArticleForm → pending-images.js). Mỗi ảnh có nút X để xóa.
 * Ảnh dán từ trang web khác (link ngoài) bị bỏ — backend chỉ nhận ảnh Cloudinary.
 * HTML được backend lọc an toàn trước khi lưu (be/src/utils/rich-text.js).
 */
export function RichTextEditor({ value, onChange, placeholder }) {
  const toast = useToast();
  const fileInput = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // chèn NGAY ảnh từ máy tại vị trí con trỏ (hoặc vị trí thả chuột) — tải lên khi bấm Lưu bài
  const insertImages = (editor, files, pos) => {
    const nodes = [];
    for (const file of [...files].filter(isImage)) {
      try {
        nodes.push({ type: "image", attrs: { src: stageFile(file).url, alt: "" } });
      } catch (err) {
        toast(err.message, "error");
      }
    }
    if (!nodes.length) return false;
    insertNodes(editor, nodes, pos);
    return true;
  };

  // chèn khối (ảnh) tại vị trí thả chuột, hoặc tại con trỏ
  const insertNodes = (editor, nodes, pos) => {
    // Đang chọn nguyên 1 khối (VD ảnh vừa chèn) → chèn NGAY SAU khối đó, không ghi đè lên nó
    const { selection } = editor.state;
    const at = pos ?? (selection.node ? selection.to : selection.to);
    editor.chain().focus().insertContentAt(at, nodes).run();
    // Sau khi chèn, ảnh cuối đang ở trạng thái "được chọn" → gõ chữ / dán (Ctrl+V) tiếp sẽ GHI ĐÈ mất ảnh.
    // Đặt con trỏ vào đoạn văn ngay sau ảnh để người dùng viết tiếp tự nhiên.
    const after = editor.state.selection.to;
    editor
      .chain()
      .insertContentAt(after, { type: "paragraph" })
      .setTextSelection(after + 1)
      .run();
  };

  const editor = useEditor({
    immediatelyRender: false, // trang quản trị render phía client — tránh lệch khi hydrate
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LineHeight,
      EditorImage,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "rich-content rich-editor" },
      // dán nội dung từ web / Word: bỏ ảnh link ngoài (không lưu được) và báo cho người dùng
      transformPastedHTML: (html) => {
        let dropped = 0;
        // ảnh có link http(s) → giữ, khi Lưu bài tự chép về Cloudinary; ảnh nhúng dạng mã (data:...) → bỏ
        const out = html.replace(/<img\s[^>]*>/gi, (tag) => {
          const src = tag.match(/src="([^"]*)"/i)?.[1] ?? "";
          if (isLocal(src) || /^https?:\/\//i.test(src)) return tag;
          dropped++;
          return "";
        });
        if (dropped)
          toast(
            `Đã bỏ ${dropped} ảnh không dùng được — hãy lưu ảnh về máy rồi dán / kéo vào bài`,
            "error",
          );
        return out;
      },
      // ảnh trong clipboard (chụp màn hình, copy ảnh, Word) → upload rồi chèn
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length || ![...files].some(isImage)) return false;
        insertImages(editorRef.current, files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = event.dataTransfer?.files;
        if (moved || !files?.length || ![...files].some(isImage)) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(editorRef.current, files, pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.isEmpty ? "" : e.getHTML()),
  });
  const editorRef = useRef(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // nội dung đổi từ bên ngoài (dịch tự động, tải bài, lưu xong) → nạp lại vào khung.
  // Dời sang microtask: setContent dựng lại khung ảnh (React node view) bằng flushSync — gọi ngay trong
  // effect sẽ bị React cảnh báo "flushSync was called from inside a lifecycle method".
  useEffect(() => {
    if (!editor) return;
    queueMicrotask(() => {
      if (!editor.isDestroyed && (value || "") !== (editor.isEmpty ? "" : editor.getHTML()))
        editor.commands.setContent(value || "", { emitUpdate: false });
    });
  }, [editor, value]);

  return (
    <div className="border-forest/15 focus-within:border-sage-500 focus-within:ring-sage-200 bg-pearl rounded-xl border focus-within:ring-2">
      {editor ? (
        <Toolbar
          editor={editor}
          onPickImages={() => fileInput.current?.click()}
          onInsertUrl={(src) => insertNodes(editor, [{ type: "image", attrs: { src, alt: "" } }])}
        />
      ) : (
        <div className="border-forest/10 h-11 border-b" />
      )}
      <EditorContent editor={editor} className="min-h-[420px] px-5 py-4 sm:px-8" />
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (editor) insertImages(editor, e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
