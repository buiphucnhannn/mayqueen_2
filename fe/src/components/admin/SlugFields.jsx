"use client";

import { Info, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { href } from "@/i18n";
import { slugify } from "./ui";

/** Khi gõ: giữ dấu "-" ở cuối để gõ tiếp được; rời ô mới chuẩn hóa hẳn bằng slugify */
const typing = (v) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "");

function SlugInput({ lang, prefix, value, onChange, onBlur, status }) {
  return (
    <label className="block">
      <span className="text-ink-muted mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase">
        {lang === "vi" ? "Tiếng Việt" : "English"}
        {status}
      </span>
      <span className="border-forest/15 bg-pearl focus-within:border-sage-500 focus-within:ring-sage-200 flex items-center rounded-xl border focus-within:ring-2">
        <span className="text-ink-muted border-forest/10 shrink-0 border-r py-2.5 pr-2 pl-3 text-xs">
          {prefix}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(typing(e.target.value))}
          onBlur={() => onBlur(slugify(value))}
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm outline-none"
        />
      </span>
    </label>
  );
}

/**
 * Đường dẫn tiếng Việt + tiếng Anh — TỰ ĐỘNG theo tiêu đề (useAutoSlugs), vẫn sửa tay được.
 *   section:  "/san-pham" | "/song-dep" (đường dẫn tiếng Việt — href() tự đổi sang /en/shop, /en/journal)
 *   source:   "tiêu đề" | "tên sản phẩm" — dùng trong câu ghi chú
 *   saved:    { slug, slugEn } đã lưu (null khi tạo mới) → khác thì báo "đường dẫn mới, link cũ vẫn dùng được"
 *   auto, translating, onAuto: trạng thái tự động từ useAutoSlugs
 */
export function SlugFields({
  section,
  source = "tiêu đề",
  value,
  onChange,
  saved,
  auto = { vi: true, en: true },
  translating = false,
  onAuto,
}) {
  const prefixVi = `${href("vi", section)}/`;
  const prefixEn = `${href("en", section)}/`;
  const changed = saved && (value.slug !== saved.slug || value.slugEn !== saved.slugEn);
  const manual = ["vi", "en"].filter((l) => !auto[l]);

  const badge = (lang) =>
    lang === "en" && translating ? (
      <span className="text-sage-700 flex items-center gap-1 tracking-normal normal-case">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Đang dịch…
      </span>
    ) : !auto[lang] ? (
      <span className="text-ink-muted/80 tracking-normal normal-case">· tự đặt</span>
    ) : null;

  return (
    <div>
      <span className="text-ink mb-1.5 block text-[13px] font-semibold">Đường dẫn</span>
      <div className="space-y-2.5">
        <SlugInput
          lang="vi"
          prefix={prefixVi}
          value={value.slug}
          status={badge("vi")}
          onChange={(slug) => onChange({ ...value, slug }, "vi")}
          onBlur={(slug) => onChange({ ...value, slug }, null)}
        />
        <SlugInput
          lang="en"
          prefix={prefixEn}
          value={value.slugEn}
          status={badge("en")}
          onChange={(slugEn) => onChange({ ...value, slugEn }, "en")}
          onBlur={(slugEn) => onChange({ ...value, slugEn }, null)}
        />
      </div>

      {manual.length === 0 ? (
        <p className="text-ink-muted mt-2 flex gap-1.5 text-xs leading-relaxed">
          <Sparkles className="text-sage-600 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>Tự đổi theo {source}, bản tiếng Anh được dịch sẵn.</span>
        </p>
      ) : (
        <p className="text-ink-muted mt-2 text-xs leading-relaxed">
          Bạn đang tự đặt đường dẫn{" "}
          {manual.map((l) => (l === "vi" ? "tiếng Việt" : "tiếng Anh")).join(" và ")} — đổi {source}{" "}
          sẽ không đổi theo.{" "}
          {onAuto && (
            <button
              type="button"
              onClick={() => manual.forEach(onAuto)}
              className="text-sage-700 hover:text-forest inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              <RotateCcw className="size-3" aria-hidden="true" /> Dùng lại tự động
            </button>
          )}
        </p>
      )}

      {changed && (
        <p className="bg-sage-50 text-sage-800 mt-2.5 flex gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Đường dẫn mới được dùng khi bạn bấm <b>Lưu</b>. Link cũ (đã chia sẻ, trên Google) vẫn mở
            được — tự chuyển sang link mới.
          </span>
        </p>
      )}
    </div>
  );
}
