"use client";

import { useRef, useState } from "react";
import Image from "@/components/ui/Img";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPT, needsUpload, stageFile, stageUrl } from "./pending-images";
import { IconButton, useEscLayer, useToast } from "./ui";

export { uploadFiles } from "./pending-images";

/**
 * 2 cách thêm ảnh ở MỌI chỗ: tải từ máy (chọn / kéo-thả) hoặc dán link ảnh → hiện NGAY (chưa tải lên).
 * Ảnh chỉ được đưa lên Cloudinary khi bấm Lưu / Tạo mới (xem pending-images.js) → thao tác tức thì,
 * bỏ ngang không để lại ảnh rác; ảnh từ link cũng được chép về Cloudinary nên không phụ thuộc trang gốc.
 */
function useStager(onFiles) {
  const toast = useToast();
  return (fileList) => {
    const out = [];
    for (const f of fileList ?? []) {
      try {
        out.push(stageFile(f));
      } catch (err) {
        toast(err.message, "error");
      }
    }
    if (out.length) onFiles(out);
  };
}

/**
 * Ô dán link ảnh: bấm "Dùng link ảnh" → hiện ô nhập; Enter / Thêm → kiểm tra link là ảnh rồi trả về.
 * compact: dùng trong popover của trình soạn thảo (luôn mở sẵn ô nhập).
 */
export function UrlImageInput({ onAdd, label = "Dùng link ảnh", compact = false, className }) {
  const [open, setOpen] = useState(compact);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // đóng ô nhập (Esc) → xóa chữ / lỗi cũ, lần mở sau là ô trống
  const close = () => {
    setOpen(false);
    setValue("");
    setError("");
  };
  useEscLayer(open && !compact, close);
  const submit = async (e) => {
    e?.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      // onAdd trả false = không nhận ảnh (VD ảnh đã có) → giữ nguyên ô nhập để sửa link
      if (onAdd(await stageUrl(value)) === false) return;
      setValue("");
      if (!compact) setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "text-sage-700 hover:text-forest inline-flex items-center gap-1.5 text-xs font-semibold",
          className,
        )}
      >
        <Link2 className="size-3.5" aria-hidden="true" /> {label}
      </button>
    );
  // không dùng <form> lồng nhau: form sản phẩm / bài viết không phải <form>, nhưng popover có thể nằm trong form khác
  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-1.5">
        <input
          autoFocus
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(e);
          }}
          placeholder="https://… (link trực tiếp tới ảnh)"
          aria-label="Link ảnh"
          className="border-forest/15 focus:border-sage-500 min-w-0 flex-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          className="bg-forest inline-flex items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {busy ? "Đang kiểm tra" : "Thêm"}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

/** Ảnh đã lưu (Cloudinary, tối ưu qua next/image) hoặc ảnh chờ lưu (ảnh trên máy / link ngoài) */
function Thumb({ img, sizes }) {
  return (
    <>
      {needsUpload(img.url) ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh tạm (blob / link ngoài), next/image không hỗ trợ
        <img
          src={img.url}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Image src={img.url} alt="" fill sizes={sizes} className="object-cover" />
      )}
    </>
  );
}

/** Kéo thả hoặc bấm để chọn ảnh */
function DropZone({ multiple, onFiles, label, className }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border-forest/20 text-ink-muted hover:border-sage-500 hover:text-sage-700 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-xs transition-colors",
        over && "border-sage-500 bg-sage-50 text-sage-700",
        className,
      )}
    >
      <UploadCloud className="size-6" aria-hidden="true" />
      <span className="font-semibold">{label}</span>
      <span>JPG, PNG, WebP</span>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}

/** 1 ảnh (ảnh đại diện, ảnh bìa...). value = { url, ... } | null */
export function ImageField({
  value,
  onChange,
  aspect = "aspect-square",
  label = "Chọn ảnh",
  fallback, // ảnh website đang dùng khi chưa chọn (hiện mờ phía sau)
}) {
  const stage = useStager((imgs) => onChange(imgs[0]));
  return (
    <div>
      <ImageFieldBox
        value={value}
        onChange={onChange}
        aspect={aspect}
        label={label}
        fallback={fallback}
        stage={stage}
      />
      <UrlImageInput onAdd={onChange} className="mt-2" />
    </div>
  );
}

function ImageFieldBox({ value, onChange, aspect, label, fallback, stage }) {
  if (!value && fallback)
    return (
      <div className={cn("relative w-full overflow-hidden rounded-xl", aspect)}>
        <Image src={fallback} alt="" fill sizes="480px" className="object-cover opacity-45" />
        <DropZone
          onFiles={stage}
          label={label}
          className="bg-pearl/55 absolute inset-0 backdrop-blur-[1px]"
        />
      </div>
    );
  if (!value) return <DropZone onFiles={stage} label={label} className={cn("w-full", aspect)} />;
  return (
    <div className={cn("group bg-sand relative w-full overflow-hidden rounded-xl", aspect)}>
      <Thumb img={value} sizes="320px" />
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <label className="bg-pearl/90 text-forest hover:bg-pearl inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold">
          <ImagePlus className="size-3.5" />
          Đổi ảnh
          <input
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              stage(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <IconButton
          label="Gỡ ảnh"
          onClick={() => onChange(null)}
          className="bg-pearl/90 hover:bg-pearl text-red-600"
        >
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

/** Nhiều ảnh, sắp xếp được — ảnh đầu tiên là ảnh đại diện. value = [{ url, ... }] */
export function ImageList({ value, onChange }) {
  const toast = useToast();
  const stage = useStager((imgs) => onChange([...value, ...imgs]));
  // không thêm trùng 1 ảnh 2 lần (ảnh trùng làm lưới hiện sai so với dữ liệu được lưu)
  const addLink = (img) => {
    if (value.some((x) => x.url === img.url)) {
      toast("Ảnh này đã có", "error");
      return false;
    }
    onChange([...value, img]);
  };
  // key ổn định & không trùng: url + số lần url đó đã xuất hiện trước (phòng dữ liệu cũ có ảnh trùng)
  const seen = new Map();
  const keys = value.map((img) => {
    const n = seen.get(img.url) ?? 0;
    seen.set(img.url, n + 1);
    return n ? `${img.url}#${n}` : img.url;
  });
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {value.map((img, i) => (
        <div
          key={keys[i]}
          className="group bg-sand relative aspect-square overflow-hidden rounded-xl"
        >
          <Thumb img={img} sizes="200px" />
          {i === 0 && (
            <span className="bg-forest absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
              Ảnh đại diện
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <span className="flex">
              <IconButton
                label="Lên trước"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="size-4" />
              </IconButton>
              <IconButton
                label="Ra sau"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <ArrowRight className="size-4" />
              </IconButton>
            </span>
            <IconButton
              label="Xóa ảnh"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="text-white hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </div>
      ))}
      <DropZone multiple onFiles={stage} label="Thêm ảnh" className="aspect-square" />
      <UrlImageInput onAdd={addLink} label="Thêm ảnh bằng link" className="col-span-full" />
    </div>
  );
}
