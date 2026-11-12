"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LEAD_STATUS, statusTabs } from "./constants";
import {
  Badge,
  Button,
  Drawer,
  ErrorNote,
  FilterTabs,
  IconButton,
  PageHeader,
  Pagination,
  RefreshButton,
  SearchBox,
  TableShell,
  dateTime,
  dateTimeFull,
  td,
  tdc,
  th,
  thc,
  useConfirm,
  useToast,
  useEscLayer,
} from "./ui";
import { emptyMessage, useAdminList, useStats } from "./useAdminList";

const TONE_CLS = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-forest/10 bg-stone/60 text-ink-muted",
};

/** Đổi trạng thái ngay trên dòng (gọi khách xong → "Đã liên hệ"...) */
function StatusSelect({ lead, onChange }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const change = async (status) => {
    setBusy(true);
    try {
      const res = await api(`/leads/${lead.id}/status`, { method: "PATCH", body: { status } });
      onChange(res.data);
      toast(`${lead.name}: ${LEAD_STATUS[status].label}`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  // Menu chọn trạng thái tự vẽ (menu mặc định của trình duyệt không chỉnh kiểu được): thẻ nổi bo góc, mỗi trạng thái
  // có icon + màu riêng, trạng thái hiện tại có dấu ✓. Vẽ qua portal (position: fixed) → không bị khung bảng cắt.
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(0);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const entries = Object.entries(LEAD_STATUS);
  const s = LEAD_STATUS[lead.status];

  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > 150; // sát đáy màn hình → mở lên trên
    setPos({
      left: r.left + r.width / 2,
      ...(below ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }),
    });
    setActive(
      Math.max(
        0,
        entries.findIndex(([v]) => v === lead.status),
      ),
    );
    setOpen(true);
  };
  const pick = (value) => {
    setOpen(false);
    btnRef.current?.focus();
    if (value !== lead.status) change(value);
  };

  useEscLayer(open, () => {
    setOpen(false);
    btnRef.current?.focus();
  });
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelectorAll("[role=option]")[active]?.focus();
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const outside = (e) =>
      !menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target) && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("mousedown", outside);
    window.addEventListener("scroll", close, true); // cuộn trang / bảng → đóng (menu không trôi lệch chỗ)
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const onMenuKey = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + d + entries.length) % entries.length);
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={busy}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Trạng thái của ${lead.name}: ${s?.label}. Bấm để đổi`}
        className={cn(
          // mọi dòng CÙNG chiều rộng, chữ căn giữa, mũi tên gọn mép phải
          "focus-visible:ring-sage-300 relative inline-flex h-8 w-32 items-center justify-center rounded-full border px-6 text-xs font-semibold transition-shadow outline-none focus-visible:ring-2 disabled:opacity-60",
          open && "ring-sage-200 ring-2",
          TONE_CLS[s?.tone],
        )}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : s?.label}
        <ChevronDown
          className={cn(
            "absolute right-2.5 size-3.5 opacity-70 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={`Đổi trạng thái của ${lead.name}`}
            onKeyDown={onMenuKey}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
            className="bg-pearl border-forest/10 fixed z-[80] w-48 -translate-x-1/2 [animation:fadeIn_.15s_ease-out] rounded-2xl border p-1.5 shadow-[0_18px_40px_-12px_rgba(20,42,28,.35)]"
          >
            {entries.map(([value, opt], i) => {
              const Icon = STATUS_ICON[value];
              const current = value === lead.status;
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={current}
                  tabIndex={i === active ? 0 : -1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(value)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors outline-none",
                    i === active ? "bg-sage-50" : "",
                    current ? "text-forest font-semibold" : "text-ink-soft",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border",
                      TONE_CLS[opt.tone],
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{opt.label}</span>
                  {current && <Check className="text-sage-600 size-4" aria-hidden="true" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

const STATUS_ICON = { new: Clock3, contacting: PhoneCall, contacted: CheckCircle2 };

/** Ngăn kéo chi tiết yêu cầu: đọc trọn lời nhắn, gọi / Zalo / chép SĐT, đổi trạng thái ngay */
function LeadDrawer({ lead, onClose, onChange, onDelete }) {
  const [busy, setBusy] = useState(null); // trạng thái đang lưu
  const toast = useToast();
  if (!lead) return <Drawer open={false} onClose={onClose} title="" />;

  const setStatus = async (status) => {
    if (status === lead.status || busy) return;
    setBusy(status);
    try {
      const res = await api(`/leads/${lead.id}/status`, { method: "PATCH", body: { status } });
      onChange(res.data);
      toast(`${lead.name}: ${LEAD_STATUS[status].label}`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(null);
    }
  };
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(lead.phone);
      toast(`Đã chép số ${lead.phone}`);
    } catch {
      toast("Không chép được — hãy bôi đen số để chép", "error");
    }
  };
  const actionCls =
    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors";

  return (
    <Drawer
      open
      onClose={onClose}
      title={lead.name}
      subtitle={
        <span className="text-ink-muted flex items-center gap-2 text-xs">
          <Badge tone={LEAD_STATUS[lead.status]?.tone}>{LEAD_STATUS[lead.status]?.label}</Badge>
          Gửi lúc {dateTimeFull(lead.createdAt)}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="danger" onClick={() => onDelete(lead)}>
            <Trash2 className="size-4" aria-hidden="true" /> Xóa yêu cầu
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Liên hệ</h3>
          <a
            href={`tel:${lead.phone}`}
            className="text-forest hover:text-sage-700 mt-2 block text-2xl font-semibold tracking-wide tabular-nums transition-colors"
          >
            {lead.phone}
          </a>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`tel:${lead.phone}`}
              className={cn(actionCls, "bg-forest text-pearl hover:bg-sage-700 border-transparent")}
            >
              <Phone className="size-3.5" aria-hidden="true" /> Gọi ngay
            </a>
            <a
              href={`https://zalo.me/${lead.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(actionCls, "border-forest/15 text-forest hover:border-forest bg-pearl")}
            >
              <MessageCircle className="size-3.5" aria-hidden="true" /> Nhắn Zalo
            </a>
            <button
              type="button"
              onClick={copyPhone}
              className={cn(actionCls, "border-forest/15 text-forest hover:border-forest bg-pearl")}
            >
              <Copy className="size-3.5" aria-hidden="true" /> Chép số
            </button>
          </div>
        </section>

        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Nhu cầu</h3>
          <p className="text-forest mt-2 font-semibold">{lead.goal || "Chưa chọn"}</p>
          <h3 className="eyebrow mt-5">Lời nhắn của khách</h3>
          {lead.note ? (
            <p className="border-sage-500 bg-sage-50/70 text-ink-soft mt-2 rounded-xl border-l-[3px] px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
              {lead.note}
            </p>
          ) : (
            <p className="text-ink-muted mt-2 text-sm">Khách không để lại lời nhắn.</p>
          )}
        </section>

        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Trạng thái chăm sóc</h3>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Trạng thái">
            {Object.entries(LEAD_STATUS).map(([value, s]) => {
              const Icon = STATUS_ICON[value];
              const active = lead.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={Boolean(busy)}
                  onClick={() => setStatus(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors disabled:cursor-wait",
                    active
                      ? TONE_CLS[s.tone]
                      : "border-forest/10 text-ink-muted hover:border-forest/30 hover:text-forest bg-white/60",
                  )}
                >
                  {busy === value ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="text-ink-muted mt-3 text-xs">
            Bấm để đổi ngay — gọi xong chuyển sang &ldquo;Đã liên hệ&rdquo;.
          </p>
        </section>
      </div>
    </Drawer>
  );
}

export default function LeadsPage() {
  const list = useAdminList("/leads");
  const [stats, reloadStats] = useStats("/leads");
  const [selected, setSelected] = useState(null);

  const confirm = useConfirm();
  const toast = useToast();

  // reloadStats: số trên tab lọc + số cạnh menu "Yêu cầu tư vấn" cập nhật ngay
  const onChange = (lead) => {
    list.setItems((items) => items.map((l) => (l.id === lead.id ? lead : l)));
    setSelected((s) => (s?.id === lead.id ? lead : s));
    reloadStats();
  };
  // Đổi trạng thái NGAY TRÊN DÒNG → tải lại theo bộ lọc đang chọn (VD đang lọc "Mới" mà chuyển sang "Đang liên hệ"
  // thì dòng đó rời danh sách ngay)
  const onRowChange = (lead) => {
    onChange(lead);
    list.reload();
  };
  // Đổi trong ngăn chi tiết → giữ nguyên tới khi đóng ngăn, đóng rồi mới tải lại (không mất dòng đang xem)
  const changed = useRef(false);
  const onDrawerChange = (lead) => {
    onChange(lead);
    changed.current = true;
  };
  const closeDrawer = () => {
    setSelected(null);
    if (changed.current) {
      changed.current = false;
      list.reload();
    }
  };

  const remove = async (lead) => {
    const ok = await confirm({
      title: `Xóa yêu cầu của “${lead.name}”?`,
      message: "Thông tin khách (tên, SĐT, lời nhắn) bị xóa vĩnh viễn, không khôi phục được.",
      confirmLabel: "Xóa yêu cầu",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/leads/${lead.id}`, { method: "DELETE" });
      setSelected(null);
      // xóa dòng cuối của trang (không phải trang 1) → tải lại để không hiện trang trống
      if (list.items.length === 1 && list.meta?.page > 1) list.setPage(list.meta.page - 1);
      else list.setItems((items) => items.filter((l) => l.id !== lead.id));
      reloadStats();
      toast(`Đã xóa yêu cầu của “${lead.name}”`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Chăm sóc khách hàng" title="Yêu cầu tư vấn">
        <p className="text-ink-muted mt-2 text-sm">
          Khách để lại thông tin qua form &ldquo;Tư vấn miễn phí&rdquo; trên website.
        </p>
      </PageHeader>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          value={list.params.status ?? ""}
          onChange={(status) => list.update({ status })}
          items={statusTabs(LEAD_STATUS, stats)}
        />
        <div className="flex items-center gap-2">
          <SearchBox
            key={list.searchKey}
            defaultValue={list.params.q ?? ""}
            placeholder="Tên, SĐT…"
            onSearch={(q) => list.update({ q })}
            className="min-w-0 flex-1 lg:w-72 lg:flex-none"
          />
          {/* làm mới: bỏ hết bộ lọc + tìm kiếm, tải lại danh sách + số trên tab lọc / menu bên trái */}
          <RefreshButton
            loading={list.loading}
            error={list.error}
            onClick={() => {
              list.refresh();
              reloadStats();
            }}
          />
        </div>
      </div>

      <ErrorNote error={list.error} className="mt-4" />

      <div className="mt-4">
        <TableShell
          loading={list.loading}
          empty={emptyMessage(list, "Chưa có yêu cầu tư vấn nào.")}
          footer={
            <Pagination
              meta={list.meta}
              onPage={list.setPage}
              onLimit={list.setLimit}
              noun="yêu cầu"
            />
          }
        >
          <table className="w-full text-sm">
            <thead className="border-forest/10 border-b">
              <tr>
                <th className={th}>Khách hàng</th>
                <th className={th}>Quan tâm</th>
                <th className={th}>Lời nhắn</th>
                <th className={thc}>Gửi lúc</th>
                <th className={thc}>Trạng thái</th>
                <th className={thc}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-forest/10 divide-y">
              {list.items.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="hover:bg-sage-50/60 cursor-pointer transition-colors"
                >
                  <td className={td}>
                    <span className="text-ink block max-w-44 truncate font-medium" title={l.name}>
                      {l.name}
                      {l.lang === "en" && (
                        <span
                          title="Khách xem trang tiếng Anh — tư vấn bằng tiếng Anh"
                          className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-800"
                        >
                          EN
                        </span>
                      )}
                    </span>
                    <a
                      href={`tel:${l.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sage-700 hover:text-forest inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      <Phone className="size-3" aria-hidden="true" /> {l.phone}
                    </a>
                  </td>
                  <td className={cn(td, "text-ink-soft text-xs")}>
                    <span className="block max-w-48 truncate" title={l.goal}>
                      {l.goal || "—"}
                    </span>
                  </td>
                  <td className={cn(td, "text-ink-soft text-xs")}>
                    {l.note ? (
                      <span className="block max-w-80 truncate" title={l.note}>
                        {l.note}
                      </span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className={cn(tdc, "text-ink-muted text-xs whitespace-nowrap")}>
                    {dateTime(l.createdAt)}
                  </td>
                  {/* đổi trạng thái / bấm nút: không mở ngăn chi tiết */}
                  <td className={tdc} onClick={(e) => e.stopPropagation()}>
                    <StatusSelect lead={l} onChange={onRowChange} />
                  </td>
                  {/* bấm vào dòng là mở chi tiết (giống trang Đơn hàng) → chỉ còn nút xóa */}
                  <td className={cn(tdc, "whitespace-nowrap")} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      label="Xóa"
                      onClick={() => remove(l)}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>

      <LeadDrawer
        key={selected?.id ?? "none"}
        lead={selected}
        onClose={closeDrawer}
        onChange={onDrawerChange}
        onDelete={remove}
      />
    </div>
  );
}
