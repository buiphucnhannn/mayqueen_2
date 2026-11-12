"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { lockScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/* Bộ thành phần giao diện dùng chung cho khu quản trị — cùng tông màu với site bán hàng. */

// ---------- Bố cục ----------
export function PageHeader({ eyebrow, title, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-sage-600 text-[11px] font-semibold tracking-[0.3em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className={cn("h-lux text-[30px] sm:text-[38px]", eyebrow && "mt-3.5")}>{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, className, children }) {
  return (
    <section className={cn("bg-pearl shadow-card rounded-2xl", className)}>
      {(title || actions) && (
        <header className="border-forest/10 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-forest font-serif text-xl">{title}</h2>
            {description && <p className="text-ink-muted mt-0.5 text-xs">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

// ---------- Nút ----------
const BTN = {
  primary: "bg-forest text-pearl hover:bg-sage-700 border-transparent",
  outline: "border-forest/15 text-forest hover:border-forest bg-pearl",
  ghost: "border-transparent text-ink-soft hover:bg-forest/5 hover:text-forest",
  danger: "border-red-200 text-red-700 hover:bg-red-50 bg-pearl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  href,
  className,
  children,
  ...props
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-55",
    size === "sm" ? "h-9 px-3.5 text-xs" : "h-10 px-4.5 text-[13px]",
    BTN[variant],
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  return (
    <button type="button" {...props} className={cls} disabled={loading || props.disabled}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "text-ink-muted hover:text-forest hover:bg-forest/5 inline-grid size-8 place-items-center rounded-full align-middle transition-colors disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------- Ô nhập ----------
export const inputCls =
  "border-forest/15 bg-pearl text-ink placeholder:text-ink-muted/70 focus:border-sage-500 focus:ring-sage-200 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 disabled:bg-linen disabled:text-ink-muted";

/** as="div": khối chứa nút / ô chọn ảnh… — không bọc <label> (bấm vào ảnh, dòng gợi ý sẽ mở hộp chọn file) */
export function Field({ label, hint, required, error, className, children, as: Tag = "label" }) {
  return (
    <Tag className={cn("block", className)}>
      <span className="text-ink mb-1.5 block text-[13px] font-semibold">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="text-ink-muted mt-1 block text-xs">{hint}</span>
      )}
    </Tag>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(inputCls, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(inputCls, "resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, options, ...props }) {
  return (
    <select className={cn(inputCls, "pr-8", className)} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Ô số tiền: hiển thị 1.050.000, lưu số nguyên */
export function MoneyInput({ value, onChange, className, ...props }) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value === "" || value == null ? "" : Number(value).toLocaleString("vi-VN")}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits === "" ? "" : Number(digits));
        }}
        className={cn(inputCls, "pr-8 text-right tabular-nums", className)}
        {...props}
      />
      <span className="text-ink-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
        ₫
      </span>
    </div>
  );
}

export function Switch({ checked, onChange, label, description, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel} // nút chỉ có công tắc, không chữ (VD trong bảng) → vẫn đọc được là bật / tắt gì
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left"
    >
      <span
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-sage-600" : "bg-stone",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span>
        <span className="text-ink block text-[13px] font-semibold">{label}</span>
        {description && <span className="text-ink-muted block text-xs">{description}</span>}
      </span>
    </button>
  );
}

// ---------- Song ngữ ----------
/** Ngôn ngữ đang nhập liệu của form (VI bắt buộc, EN tùy chọn — để trống thì web dùng bản VI) */
const EditLangContext = createContext("vi");
export const useEditLang = () => useContext(EditLangContext);
export const EditLangProvider = EditLangContext;

export function LangTabs({ value, onChange }) {
  return (
    <div className="border-forest/10 bg-linen inline-flex rounded-full border p-1" role="tablist">
      {[
        ["vi", "Tiếng Việt"],
        ["en", "English"],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            value === id ? "bg-forest text-white" : "text-ink-soft hover:text-forest",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Ô nhập cho chuỗi song ngữ { vi, en } theo ngôn ngữ đang chọn ở form */
export function LocalizedInput({ value, onChange, multiline, rows, placeholder, ...props }) {
  const lang = useEditLang();
  const v = value ?? { vi: "", en: "" };
  const Comp = multiline ? Textarea : Input;
  const noVi = lang === "en" && !v.vi?.trim();
  return (
    <>
      <Comp
        value={v[lang] ?? ""}
        rows={rows}
        onChange={(e) => onChange({ ...v, [lang]: e.target.value })}
        placeholder={lang === "en" ? v.vi || "(English)" : placeholder}
        lang={lang}
        {...props}
      />
      {/* Tab English: ô tiếng Việt còn trống → không dịch tự động được, nhắc nhẹ */}
      {noVi && (
        <span className="mt-1 block text-[11px] text-amber-700/80">
          Chưa có bản tiếng Việt để dịch
        </span>
      )}
    </>
  );
}

export const emptyLoc = () => ({ vi: "", en: "" });

/** Trường hệ thống tự sinh (đường dẫn, ngày đăng, thời gian đọc...) — chỉ hiển thị, không sửa */
export function AutoField({ label, hint, children }) {
  return (
    <div>
      <span className="text-ink mb-1.5 block text-[13px] font-semibold">{label}</span>
      <div className="border-forest/10 bg-linen text-ink-soft rounded-xl border px-3.5 py-2.5 text-sm break-all">
        {children}
      </div>
      {hint && <span className="text-ink-muted mt-1 block text-xs">{hint}</span>}
    </div>
  );
}

// ---------- Danh sách / bảng ----------
/** Nội dung 1 chip lọc: tên (dài → cắt "…", rê chuột xem đủ) + số đếm */
function TabLabel({ it, active }) {
  return (
    <>
      <span
        className="max-w-[12rem] truncate"
        title={typeof it.label === "string" ? it.label : undefined}
      >
        {it.label}
      </span>
      {it.count != null && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px] tabular-nums",
            active ? "bg-white/20" : "bg-forest/5",
          )}
        >
          {it.count}
        </span>
      )}
    </>
  );
}

const tabCls = (active) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap transition-colors",
    active
      ? "bg-forest border-forest text-white"
      : "border-forest/10 bg-pearl text-ink-soft hover:border-forest/30 hover:text-forest",
  );

const TAB_GAP = 4; // gap-1
const MORE_W = 44; // nút "…"

/**
 * Tab lọc (danh mục / trạng thái). Bao nhiêu chip vừa khung thì hiện bấy nhiêu; phần còn lại gom vào nút
 * "…" → danh sách thả xuống để chọn. Mục đang chọn LUÔN hiện ngoài (đưa vào vị trí chip cuối nếu bị gom).
 * Đo lại khi đổi cỡ màn hình / thêm bớt mục.
 */
export function FilterTabs({ value, onChange, items }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const menuRef = useRef(null);
  const [fit, setFit] = useState(items.length);
  const [open, setOpen] = useState(false);

  // đo bề rộng từng chip (bản ẩn) → số chip vừa khung
  useEffect(() => {
    const wrap = wrapRef.current;
    const m = measureRef.current;
    if (!wrap || !m) return;
    const calc = () => {
      const widths = [...m.children].map((c) => c.getBoundingClientRect().width);
      const avail = wrap.clientWidth;
      const total = widths.reduce((s, w) => s + w, 0) + TAB_GAP * (widths.length - 1);
      if (total <= avail) return setFit(widths.length);
      let used = 0;
      let n = 0;
      for (const w of widths) {
        const next = used + (n ? TAB_GAP : 0) + w;
        if (next + TAB_GAP + MORE_W > avail) break;
        used = next;
        n++;
      }
      setFit(Math.max(1, n));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [items]);

  // đóng danh sách: bấm ra ngoài / Esc (Esc qua ngăn xếp lớp phủ — chỉ đóng lớp trên cùng)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !menuRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  useEscLayer(open, () => setOpen(false));

  let shown = items.slice(0, fit);
  const activeIdx = items.findIndex((it) => it.value === value);
  if (activeIdx >= fit && fit > 0) shown = [...items.slice(0, fit - 1), items[activeIdx]];
  const hidden = items.filter((it) => !shown.includes(it));

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      {/* bản ẩn để đo bề rộng chip */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex gap-1"
      >
        {items.map((it) => (
          <span key={it.value} className={tabCls(it.value === value)}>
            <TabLabel it={it} active={it.value === value} />
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {shown.map((it) => (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={tabCls(value === it.value)}
          >
            <TabLabel it={it} active={value === it.value} />
          </button>
        ))}

        {hidden.length > 0 && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={`Xem thêm ${hidden.length} mục`}
              aria-haspopup="listbox"
              aria-expanded={open}
              title={`Thêm ${hidden.length} mục`}
              className={cn(
                tabCls(false),
                "w-11 justify-center px-0",
                open && "border-forest/30 text-forest",
              )}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
            {open && (
              <ul
                role="listbox"
                className="border-forest/10 bg-pearl absolute top-full left-0 z-30 mt-2 max-h-72 w-64 [animation:fadeIn_.15s_ease-out_both] overflow-y-auto rounded-2xl border p-1.5 shadow-xl max-sm:right-0 max-sm:left-auto"
                data-lenis-prevent
              >
                {hidden.map((it) => (
                  <li key={it.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === it.value}
                      onClick={() => {
                        onChange(it.value);
                        setOpen(false);
                      }}
                      className="hover:bg-sage-50 text-ink-soft hover:text-forest flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors"
                    >
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={typeof it.label === "string" ? it.label : undefined}
                      >
                        {it.label}
                      </span>
                      {it.count != null && (
                        <span className="bg-forest/5 rounded-full px-1.5 text-[11px] tabular-nums">
                          {it.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Ô tìm kiếm: ngừng gõ 350ms mới gọi onSearch. Chỉ chạy khi CHỮ thay đổi — onSearch truyền kiểu
 *  (q) => ... tạo hàm mới mỗi lần render, nếu đưa vào deps sẽ gọi lặp vô hạn (bảng tải lại liên tục). */
/** Ô tìm kiếm (gõ xong 350ms mới tìm). defaultValue: từ khóa cũ trên URL — truyền kèm key để nạp lại */
export function SearchBox({ placeholder, onSearch, className, defaultValue = "" }) {
  const [text, setText] = useState(defaultValue);
  const onSearchRef = useRef(onSearch);
  const last = useRef(defaultValue.trim());
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  useEffect(() => {
    const q = text.trim();
    if (q === last.current) return;
    const t = setTimeout(() => {
      last.current = q;
      onSearchRef.current(q);
    }, 350);
    return () => clearTimeout(t);
  }, [text]);
  return (
    <div className={cn("relative", className)}>
      <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, "rounded-full pl-10")}
      />
    </div>
  );
}

/**
 * Nút tròn "Làm mới" (đặt cạnh ô tìm kiếm): tải lại dữ liệu của tab đang xem — đơn mới, yêu cầu mới…
 * Bằng đúng ô tìm kiếm (42px). Biểu tượng xoay trong lúc tải; tải xong hiện thông báo "Đã làm mới"
 * (lỗi → thông báo lỗi). loading / error: trạng thái tải của danh sách (useAdminList).
 */
export function RefreshButton({ onClick, loading = false, error = null, label = "Làm mới" }) {
  const toast = useToast();
  const [spin, setSpin] = useState(false);
  const pending = useRef(null); // { seen: đã thấy bắt đầu tải chưa }

  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    if (loading) {
      p.seen = true;
      return;
    }
    if (!p.seen) return;
    pending.current = null;
    if (error) toast(error.message || "Không làm mới được, vui lòng thử lại", "error");
    else toast("Đã làm mới — dữ liệu mới nhất");
  }, [loading, error, toast]);

  return (
    <button
      type="button"
      onClick={() => {
        pending.current = { seen: false };
        setSpin(true);
        onClick?.();
        setTimeout(() => setSpin(false), 800); // xoay ít nhất 1 vòng cho người dùng thấy đã bấm
      }}
      disabled={loading}
      aria-label={label}
      title={label}
      className="border-forest/15 bg-pearl text-ink-soft hover:border-forest/30 hover:text-forest grid size-[42px] shrink-0 place-items-center rounded-full border transition-colors disabled:cursor-wait"
    >
      <RefreshCw className={cn("size-4", (loading || spin) && "animate-spin")} aria-hidden="true" />
    </button>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    sage: "bg-sage-50 text-sage-800 border-sage-200",
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-stone/60 text-ink-muted border-forest/10",
  };
  return (
    <span
      className={cn(
        "inline-block max-w-[11rem] truncate rounded-full border px-2.5 py-0.5 align-middle text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function TableShell({ loading, empty, children, footer }) {
  return (
    <div className="bg-pearl shadow-card relative overflow-hidden rounded-2xl">
      {/* mq-stack (globals.css): điện thoại → mỗi dòng thành 1 thẻ xếp gọn (mã/khách, tổng, trạng thái, thao tác
          đều thấy ngay), không phải kéo ngang để tìm cột Tổng / Trạng thái */}
      <div className="mq-stack overflow-x-auto">{children}</div>
      {empty && <div className="text-ink-muted px-6 py-14 text-center text-sm">{empty}</div>}
      {loading && (
        <div className="bg-pearl/60 absolute inset-0 grid place-items-center">
          <Loader2 className="text-sage-600 size-6 animate-spin" aria-hidden="true" />
        </div>
      )}
      {footer}
    </div>
  );
}

const thBase =
  "text-ink-muted px-4 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap first:pl-6 last:pr-6";
const tdBase = "px-4 py-3.5 align-middle first:pl-6 last:pr-6";
/** Ô bảng: th/td căn trái (cột tên, chữ dài) — thc/tdc căn giữa (số, trạng thái, ngày, thao tác) */
export const th = `${thBase} text-left`;
export const td = `${tdBase} text-left`;
export const thc = `${thBase} text-center`;
export const tdc = `${tdBase} text-center`;

/**
 * Các ô số trang cần hiện: luôn có trang đầu, trang cuối, trang hiện tại ±1; chỗ bị lược → "…".
 * VD trang 6/12: 1 … 5 6 7 … 12. Khoảng lược chỉ 1 trang thì hiện luôn số đó (không ai muốn "…" thay cho 1 số).
 */
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((n) => keep.add(n));
  if (page >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    const prev = nums[i - 1];
    if (prev && n - prev === 2) out.push(prev + 1);
    else if (prev && n - prev > 2) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

const PAGE_BTN =
  "grid h-8 min-w-8 place-items-center rounded-full px-2 text-xs font-semibold tabular-nums transition-colors";

/**
 * Chân bảng: "Hiển thị 21–40 trên 125 đơn hàng" · chọn số dòng/trang · ‹ 1 … 4 5 6 … 12 ›
 * - noun: tên đối tượng (đơn hàng, yêu cầu, bài viết...)
 * - onLimit: bỏ trống → không cho chọn số dòng/trang (VD Sản phẩm: cần thấy đủ để kéo-thả sắp xếp)
 */
export function Pagination({ meta, onPage, onLimit, pageSizes = [10, 20, 50, 100], noun = "mục" }) {
  if (!meta || !meta.total) return null;
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="border-forest/10 text-ink-muted flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-6 py-3 text-xs">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span>
          {totalPages > 1 ? (
            <>
              Hiển thị{" "}
              <b className="text-ink font-semibold tabular-nums">
                {from}–{to}
              </b>{" "}
              trên{" "}
            </>
          ) : (
            "Tổng cộng "
          )}
          <b className="text-ink font-semibold tabular-nums">{total}</b> {noun}
        </span>
        {onLimit && (
          <label className="flex items-center gap-2">
            Mỗi trang
            <select
              value={limit}
              onChange={(e) => onLimit(Number(e.target.value))}
              className="border-forest/15 text-ink focus:border-sage-500 h-8 cursor-pointer rounded-full border bg-transparent pr-7 pl-3 text-xs font-semibold outline-none"
            >
              {pageSizes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <IconButton label="Trang trước" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          {/* điện thoại: gọn "3 / 12"; máy tính: đủ số trang để nhảy nhanh */}
          <span className="text-ink px-2 font-semibold tabular-nums sm:hidden">
            {page} / {totalPages}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            {pageItems(page, totalPages).map((n) =>
              typeof n === "string" ? (
                <span key={n} className="w-6 text-center select-none" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => n !== page && onPage(n)}
                  aria-label={`Trang ${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    PAGE_BTN,
                    n === page
                      ? "bg-forest text-white"
                      : "text-ink-soft hover:bg-forest/5 hover:text-forest",
                  )}
                >
                  {n}
                </button>
              ),
            )}
          </span>
          <IconButton
            label="Trang sau"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </IconButton>
        </nav>
      )}
    </div>
  );
}

export function ErrorNote({ error, className }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
        className,
      )}
    >
      <p className="font-semibold">{error.message || String(error)}</p>
      {error.details?.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
          {error.details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Lớp phủ: hộp thoại, ngăn kéo ----------
/**
 * Ngăn xếp các lớp đóng được bằng Esc (hộp thoại, ngăn kéo, menu, ô sửa tại chỗ…). Chỉ 1 sự kiện
 * keydown cho cả trang: Esc chỉ đóng lớp MỞ SAU CÙNG (trên cùng) — không đóng dây chuyền các lớp bên dưới
 * (VD hộp xác nhận nằm trên popup Danh mục → Esc chỉ tắt hộp xác nhận).
 */
const escStack = [];
function onEscKey(e) {
  if (e.key !== "Escape" || !escStack.length || e.isComposing) return;
  e.preventDefault();
  e.stopPropagation();
  escStack[escStack.length - 1].current?.();
}

/** Đăng ký 1 lớp đóng bằng Esc khi active = true. onEsc đọc qua ref → đổi hàm không làm lớp đổi chỗ. */
export function useEscLayer(active, onEsc) {
  const ref = useRef(onEsc);
  useEffect(() => {
    ref.current = onEsc;
  });
  useEffect(() => {
    if (!active) return;
    if (!escStack.length) window.addEventListener("keydown", onEscKey, true);
    escStack.push(ref);
    return () => {
      const i = escStack.lastIndexOf(ref);
      if (i >= 0) escStack.splice(i, 1);
      if (!escStack.length) window.removeEventListener("keydown", onEscKey, true);
    };
  }, [active]);
}

function useOverlay(open, onClose) {
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [open]);
  useEscLayer(open, () => onClose?.());
}

/** Ngăn kéo trượt từ phải — xem / sửa chi tiết đơn hàng */
export function Drawer({ open, onClose, title, subtitle, footer, children }) {
  useOverlay(open, onClose);
  return (
    <div
      className={cn("fixed inset-0 z-[60]", open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <div
        onClick={onClose}
        className={cn(
          "bg-forest-deep/50 absolute inset-0 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "bg-linen absolute inset-y-0 right-0 flex w-full max-w-xl flex-col shadow-2xl transition-[transform,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          // đóng: ẩn hẳn (invisible) — tránh vệt bóng đổ sát mép phải màn hình
          open ? "visible translate-x-0" : "invisible translate-x-full",
        )}
      >
        <header className="border-forest/10 bg-pearl flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-forest font-serif text-2xl">{title}</h2>
            {subtitle && <div className="mt-1">{subtitle}</div>}
          </div>
          <IconButton label="Đóng" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
        <div
          className="flex-1 overflow-y-auto px-6 py-6 [overflow-wrap:anywhere]"
          data-lenis-prevent
        >
          {children}
        </div>
        {footer && (
          <footer className="border-forest/10 bg-pearl border-t px-6 py-4">{footer}</footer>
        )}
      </aside>
    </div>
  );
}

/** Hộp thoại xác nhận (xóa...) — trả Promise<boolean> qua useConfirm() */
const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function AdminProviders({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    [],
  );
  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };
  const toast = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);
  useOverlay(!!dialog, () => close(false));

  return (
    <ConfirmContext value={confirm}>
      <ToastContext value={toast}>
        {children}
        {dialog && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <div className="bg-forest-deep/50 absolute inset-0" onClick={() => close(false)} />
            <div
              role="alertdialog"
              aria-modal="true"
              className="bg-pearl relative w-full max-w-md [animation:fadeUp_.25s_ease-out_both] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex gap-4">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    dialog.danger ? "bg-red-50 text-red-600" : "bg-sage-100 text-sage-700",
                  )}
                >
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
                {/* hộp thoại vẽ ngoài <main> (portal) → tự đặt xuống dòng cho tên dài */}
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <h3 className="text-forest font-serif text-xl">{dialog.title}</h3>
                  {dialog.message && (
                    <p className="text-ink-soft mt-1.5 text-sm">{dialog.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => close(false)}>
                  {dialog.cancelLabel ?? "Hủy"}
                </Button>
                <Button
                  variant={dialog.danger ? "danger" : "primary"}
                  onClick={() => close(true)}
                  autoFocus
                >
                  {dialog.confirmLabel ?? "Đồng ý"}
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="pointer-events-none fixed top-4 right-4 z-[80] flex flex-col items-end gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                "flex max-w-[min(92vw,30rem)] [animation:fadeUp_.3s_ease-out_both] items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium [overflow-wrap:anywhere] shadow-lg",
                t.tone === "error" ? "bg-red-700 text-white" : "bg-forest text-pearl",
              )}
            >
              {t.tone === "error" ? (
                <AlertTriangle className="size-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              )}
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext>
    </ConfirmContext>
  );
}

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

// ---------- Định dạng ----------
export const dateTime = (iso) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );

export const dateOnly = (iso) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(iso));

/** "Mayqueen Slim Pro" → "mayqueen-slim-pro" (bỏ dấu tiếng Việt) */
export function slugify(text = "") {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Hộp thoại giữa màn hình (quản lý danh mục, tạo nhanh...) */
export function Modal({ open, onClose, title, description, size = "md", footer, children }) {
  useOverlay(open, onClose);
  if (!open) return null;
  // Portal ra <body>: popup có thể được mở từ trong khối "sticky" (cột phải của form) — khối sticky
  // tạo lớp xếp chồng riêng nên z-index của popup bị "nhốt" và thanh công cụ soạn thảo (sticky) đè lên.
  return createPortal(
    <div className="fixed inset-0 z-[65] grid place-items-center p-4 [&>*]:min-w-0">
      <div className="bg-forest-deep/50 absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "bg-pearl relative flex max-h-[calc(100svh-2rem)] w-full min-w-0 [animation:fadeUp_.25s_ease-out_both] flex-col rounded-2xl shadow-2xl",
          size === "lg" ? "max-w-2xl" : "max-w-md",
        )}
      >
        <header className="border-forest/10 flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="text-forest font-serif text-2xl">{title}</h2>
            {description && <p className="text-ink-muted mt-0.5 text-xs">{description}</p>}
          </div>
          <IconButton label="Đóng" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
        <div
          className="flex-1 overflow-y-auto px-6 py-5 [overflow-wrap:anywhere]"
          data-lenis-prevent
        >
          {children}
        </div>
        {footer && <footer className="border-forest/10 border-t px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
