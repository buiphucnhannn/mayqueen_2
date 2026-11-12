"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Landmark,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  RotateCcw,
  StickyNote,
  Trash2,
  Truck,
  Undo2,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { isComboNote, packSummary, packText, unitsFromProducts } from "@/lib/pack";
import {
  ORDER_STATUS,
  PAYMENT_FILTERS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  statusTabs,
} from "./constants";
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
  Select,
  TableShell,
  Textarea,
  dateTime,
  dateTimeFull,
  td,
  tdc,
  th,
  thc,
  useConfirm,
  useToast,
} from "./ui";
import { emptyMessage, useAdminList, useStats } from "./useAdminList";

// Đơn hàng là chứng từ bán hàng → chỉ xóa được đơn "Đã hủy" (backend cũng chặn)
const canDelete = (order) => order.status === "cancelled";

const DELETE_HINT = "Chỉ xóa được đơn đã hủy — chuyển đơn sang “Đã hủy” trước";

/** Quy trình xử lý đơn theo thứ tự (Hủy đơn tách riêng — không phải 1 bước) */
const FLOW = [
  ["pending", Clock3],
  ["confirmed", CheckCircle2],
  ["shipping", Truck],
  ["completed", PackageCheck],
];

/**
 * Chọn trạng thái dạng thanh tiến trình: bước hiện tại tô đậm, bước đã qua tô nhạt + đường nối,
 * bấm bước bất kỳ để chuyển. "Hủy đơn" là nút riêng (đỏ); đơn đã hủy → "Mở lại đơn".
 */
function StatusPicker({ value, onChange }) {
  const cancelled = value === "cancelled";
  const current = FLOW.findIndex(([v]) => v === value);
  return (
    <div>
      <ol className={cn("grid grid-cols-4 gap-1.5", cancelled && "opacity-45")}>
        {FLOW.map(([v, Icon], i) => {
          const active = i === current;
          const done = !cancelled && i < current;
          return (
            <li key={v} className="relative">
              {/* đường nối sang bước sau */}
              {i < FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[22px] left-[calc(50%+24px)] h-0.5 w-[calc(100%-48px+6px)] rounded-full",
                    !cancelled && i < current ? "bg-sage-500" : "bg-forest/12",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onChange(v)}
                aria-pressed={active}
                className="group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center"
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-full border-2 transition-colors",
                    active
                      ? "bg-forest border-forest text-white shadow-[0_6px_16px_-6px_rgba(30,58,40,.6)]"
                      : done
                        ? "bg-sage-100 border-sage-300 text-sage-700"
                        : "border-forest/15 text-ink-muted group-hover:border-forest/40 group-hover:text-forest bg-white",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "text-[11.5px] leading-tight font-semibold",
                    active ? "text-forest" : done ? "text-sage-700" : "text-ink-muted",
                  )}
                >
                  {ORDER_STATUS[v].label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-forest/10 mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <span
          className={cn("text-xs", cancelled ? "font-semibold text-red-700" : "text-ink-muted")}
        >
          {cancelled ? "Đơn đã hủy" : "Khách đổi ý / không liên lạc được?"}
        </span>
        {cancelled ? (
          <button
            type="button"
            onClick={() => onChange("pending")}
            className="text-forest border-forest/20 hover:border-forest inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Mở lại đơn
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange("cancelled")}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <Ban className="size-3.5" aria-hidden="true" /> Hủy đơn
          </button>
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => (
  <Badge tone={ORDER_STATUS[status]?.tone}>{ORDER_STATUS[status]?.label ?? status}</Badge>
);

const isTransfer = (order) => order?.paymentMethod === "bank_transfer";
// đơn cũ (trước khi có chuyển khoản) không có paymentStatus → coi là chưa nhận tiền
const paymentStatusOf = (order) => order?.paymentStatus ?? "unpaid";
// nhãn hiển thị: chưa nhận tiền nhưng khách đã bấm "Xác nhận đã thanh toán" → "Khách báo đã chuyển khoản"
const paymentLabelOf = (order) =>
  paymentStatusOf(order) === "unpaid" && order?.paymentClaimedAt
    ? "claimed"
    : paymentStatusOf(order);

/** Nhãn thanh toán: COD (xám) · Chuyển khoản chờ tiền (vàng) · Đã thanh toán (xanh) */
function PaymentBadge({ order }) {
  if (!isTransfer(order)) return <Badge>{PAYMENT_METHOD.cod.label}</Badge>;
  const s = PAYMENT_STATUS[paymentLabelOf(order)];
  return <Badge tone={order.status === "cancelled" ? "neutral" : s.tone}>{s.label}</Badge>;
}

/**
 * Khối thanh toán trong ngăn chi tiết (chỉ đơn chuyển khoản): số tiền + nội dung cần đối chiếu sao kê,
 * nút "Xác nhận đã thanh toán" (lưu ngay, có hỏi lại) / "Bỏ xác nhận" khi bấm nhầm.
 */
function PaymentSection({ order, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const confirm = useConfirm();
  const toast = useToast();
  const paid = paymentStatusOf(order) === "paid";

  const setPayment = async (paymentStatus) => {
    const ok = await confirm(
      paymentStatus === "paid"
        ? {
            title: `Xác nhận đã nhận tiền đơn ${order.code}?`,
            message: `Chỉ xác nhận khi sao kê tài khoản đã có khoản ${formatPrice(order.total)} với nội dung “${order.code}”.`,
            confirmLabel: "Đã nhận tiền",
            cancelLabel: "Chưa",
          }
        : {
            title: "Bỏ xác nhận thanh toán?",
            message: `Đơn ${order.code} sẽ quay về chưa nhận tiền và khách tra cứu đơn sẽ thấy lại mã QR.`,
            confirmLabel: "Bỏ xác nhận",
            cancelLabel: "Giữ nguyên",
            danger: true,
          },
    );
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api(`/orders/${order.id}`, {
        method: "PATCH",
        body: {
          paymentStatus,
          ...(order.updatedAt && { expectedUpdatedAt: order.updatedAt }),
        },
      });
      onSaved(res.data);
      toast(
        paymentStatus === "paid"
          ? `Đã xác nhận thanh toán đơn ${order.code}`
          : `Đã bỏ xác nhận thanh toán đơn ${order.code}`,
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-5",
        paid ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="eyebrow flex items-center gap-1.5">
          <Landmark className="size-3.5" aria-hidden="true" /> Thanh toán chuyển khoản
        </h3>
        <PaymentBadge order={order} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-muted text-xs">Số tiền cần nhận</dt>
          <dd className="text-forest text-lg font-semibold tabular-nums">
            {formatPrice(order.total)}
          </dd>
        </div>
        {/* căn phải: 2 cột bám 2 mép khung (trái số tiền, phải nội dung) */}
        <div className="text-right">
          <dt className="text-ink-muted text-xs">Nội dung chuyển khoản</dt>
          <dd className="text-forest text-lg font-semibold tracking-wider">{order.code}</dd>
        </div>
      </dl>
      {paid ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            <BadgeCheck className="size-4" aria-hidden="true" />
            Đã nhận tiền{order.paidAt && ` lúc ${dateTimeFull(order.paidAt)}`}
          </p>
          <button
            type="button"
            onClick={() => setPayment("unpaid")}
            disabled={saving}
            className="text-ink-muted hover:text-forest inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50"
          >
            <Undo2 className="size-3.5" aria-hidden="true" /> Bỏ xác nhận
          </button>
        </div>
      ) : (
        <>
          {order.paymentClaimedAt && (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-center text-xs text-amber-900">
              Khách đã bấm <strong>“Xác nhận đã thanh toán”</strong> lúc{" "}
              <strong className="whitespace-nowrap">{dateTimeFull(order.paymentClaimedAt)}</strong>
            </p>
          )}
          {/* căn giữa + text-balance: các dòng dài đều nhau; số tiền / mã đơn không bị ngắt giữa chừng */}
          <p className="text-ink-soft mt-4 text-center text-xs leading-relaxed text-balance">
            Kiểm tra app ngân hàng đã nhận{" "}
            <strong className="whitespace-nowrap">{formatPrice(order.total)}</strong> với nội dung{" "}
            <strong className="whitespace-nowrap">{order.code}</strong>, rồi bấm xác nhận bên dưới.
          </p>
          <Button onClick={() => setPayment("paid")} loading={saving} className="mt-3 w-full">
            <BadgeCheck className="size-4" aria-hidden="true" /> Xác nhận đã thanh toán
          </Button>
        </>
      )}
      <ErrorNote error={error} className="mt-3" />
    </section>
  );
}

// Thứ tự xử lý đơn (dùng để nhận ra thao tác "lùi trạng thái")
const STEP_ORDER = ["pending", "confirmed", "shipping", "completed"];

/** Ngăn kéo chi tiết đơn: thông tin giao hàng, sản phẩm, đổi trạng thái + ghi chú nội bộ */
/**
 * Đơn vị kho (lọ / hộp) của từng sản phẩm — đọc 1 lần từ danh sách sản phẩm, dùng chung cho mọi lần mở đơn.
 * Lỗi mạng → {} (tổng kết vẫn hiện số lượng, chỉ thiếu chữ "lọ" / "hộp"), lần mở sau thử lại.
 */
let unitsPromise = null;
function useProductUnits() {
  const [units, setUnits] = useState({});
  useEffect(() => {
    let alive = true;
    unitsPromise ??= api("/products/manage?limit=100")
      .then((res) => unitsFromProducts(res.data))
      .catch(() => {
        unitsPromise = null;
        return {};
      });
    unitsPromise.then((u) => alive && setUnits(u));
    return () => {
      alive = false;
    };
  }, []);
  return units;
}

function OrderDrawer({ order, onClose, onSaved, onDelete }) {
  const units = useProductUnits();
  const [status, setStatus] = useState(order?.status);
  const [note, setNote] = useState(order?.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  if (!order) return <Drawer open={false} onClose={onClose} title="" />;
  const dirty = status !== order.status || note.trim() !== (order.adminNote ?? "");

  // Esc / bấm nền mờ / nút Đóng: còn thay đổi chưa lưu (trạng thái, ghi chú) → hỏi trước khi đóng
  const requestClose = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Bỏ các thay đổi chưa lưu?",
        message: `Trạng thái / ghi chú của đơn ${order.code} chưa được lưu. Đóng bây giờ thì các thay đổi này sẽ mất.`,
        confirmLabel: "Bỏ thay đổi",
        cancelLabel: "Ở lại",
        danger: true,
      }))
    )
      return;
    onClose();
  };

  const save = async () => {
    // Lùi trạng thái (VD "Hoàn tất" → "Chờ xác nhận") hoặc huỷ đơn đang giao / đã hoàn tất → hỏi lại, tránh bấm nhầm
    const rank = (s) => STEP_ORDER.indexOf(s);
    const backwards = status !== "cancelled" && rank(status) < rank(order.status);
    const cancelLate = status === "cancelled" && ["shipping", "completed"].includes(order.status);
    if (
      status !== order.status &&
      (backwards || cancelLate) &&
      !(await confirm({
        title: cancelLate ? `Huỷ đơn ${order.code}?` : "Chuyển trạng thái lùi lại?",
        message: `Đơn đang ở “${ORDER_STATUS[order.status].label}”. Bạn chắc chắn chuyển sang “${ORDER_STATUS[status].label}”?`,
        confirmLabel: cancelLate ? "Huỷ đơn" : "Chuyển trạng thái",
        cancelLabel: "Giữ nguyên",
        danger: cancelLate,
      }))
    )
      return;
    // Đơn chuyển khoản: giao hàng khi CHƯA nhận tiền / hủy đơn ĐÃ nhận tiền (phải hoàn tiền) → hỏi lại
    const unpaidShip =
      isTransfer(order) &&
      paymentStatusOf(order) !== "paid" &&
      ["shipping", "completed"].includes(status) &&
      status !== order.status;
    const paidCancel =
      isTransfer(order) &&
      paymentStatusOf(order) === "paid" &&
      status === "cancelled" &&
      order.status !== "cancelled";
    if (
      (unpaidShip || paidCancel) &&
      !(await confirm(
        unpaidShip
          ? {
              title: "Đơn chuyển khoản chưa nhận tiền",
              message: `Đơn ${order.code} chưa được xác nhận thanh toán. Vẫn chuyển sang “${ORDER_STATUS[status].label}”?`,
              confirmLabel: "Vẫn chuyển",
              cancelLabel: "Kiểm tra lại",
            }
          : {
              title: `Hủy đơn đã thanh toán ${order.code}?`,
              message: `Khách đã chuyển khoản ${formatPrice(order.total)} cho đơn này — nhớ hoàn tiền cho khách sau khi hủy.`,
              confirmLabel: "Hủy đơn",
              cancelLabel: "Giữ đơn",
              danger: true,
            },
      ))
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        // chỉ gửi ghi chú khi có sửa → không ghi đè ghi chú người khác vừa lưu
        ...(note.trim() !== (order.adminNote ?? "") && { adminNote: note.trim() }),
        ...(status !== order.status && { status }),
        // bản đang mở → đơn đã được người khác / tab khác cập nhật sau đó thì server từ chối, không ghi đè
        ...(order.updatedAt && { expectedUpdatedAt: order.updatedAt }),
      };
      const res = await api(`/orders/${order.id}`, { method: "PATCH", body });
      onSaved(res.data);
      toast(`Đã cập nhật đơn ${order.code}`);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const c = order.customer;
  return (
    <Drawer
      open
      onClose={requestClose}
      title={`Đơn ${order.code}`}
      subtitle={
        <span className="text-ink-muted flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={order.status} /> <PaymentBadge order={order} /> Đặt lúc{" "}
          {dateTimeFull(order.createdAt)}
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          {/* xóa theo trạng thái ĐÃ LƯU (chọn "Đã hủy" mà chưa lưu thì chưa xóa được) */}
          {canDelete(order) && (
            <Button variant="danger" onClick={() => onDelete(order)} className="mr-auto">
              <Trash2 className="size-4" aria-hidden="true" /> Xóa đơn
            </Button>
          )}
          <Button variant="ghost" onClick={requestClose}>
            Đóng
          </Button>
          <Button onClick={save} loading={saving} disabled={!dirty}>
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <ErrorNote error={error} />

        {isTransfer(order) && <PaymentSection order={order} onSaved={onSaved} />}

        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Khách hàng</h3>
          <p className="text-forest mt-2 text-lg font-semibold">
            {c.name}
            {order.lang === "en" && (
              <span
                title="Khách xem trang tiếng Anh — tư vấn bằng tiếng Anh"
                className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-800"
              >
                EN
              </span>
            )}
          </p>
          <ul className="text-ink-soft mt-2 space-y-1.5 text-sm">
            <li className="flex gap-2">
              <Phone className="text-sage-600 mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href={`tel:${c.phone}`} className="text-forest font-semibold hover:underline">
                {c.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <MapPin className="text-sage-600 mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {c.address}
                {c.province && `, ${c.province}`}
              </span>
            </li>
            {c.note && (
              <li className="flex gap-2">
                <MessageSquareText
                  className="text-sage-600 mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="italic">“{c.note}”</span>
              </li>
            )}
          </ul>
        </section>

        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Sản phẩm</h3>
          <ul className="divide-forest/10 mt-2 divide-y">
            {order.lines.map((l) => (
              <li
                key={`${l.slug}:${l.optionId}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="text-forest block font-semibold">{l.name}</span>
                  <span className="text-ink-muted text-xs">
                    {l.optionLabel} - {formatPrice(l.price)} × {l.qty}
                  </span>
                  {/* "Cần chuẩn bị" theo đơn vị kho (lọ / hộp / số món trong combo) → đóng hàng không phải tính */}
                  <span className="bg-sage-50 text-forest mt-1.5 block w-fit rounded-lg px-2.5 py-1 text-xs leading-relaxed">
                    <span className="text-ink-muted">Cần chuẩn bị: </span>
                    <strong className="font-semibold">{packText(l)}</strong>
                  </span>
                </span>
                <span className="text-forest shrink-0 font-semibold whitespace-nowrap tabular-nums">
                  {formatPrice(l.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          {/* Tổng kết đóng hàng: gộp combo + hàng lẻ thành tổng từng sản phẩm (đơn có combo hoặc từ 2 món) */}
          {(() => {
            const summary =
              (order.lines.length > 1 || order.lines.some((l) => isComboNote(l.optionNote))) &&
              packSummary(order.lines, units);
            if (!summary?.length) return null;
            return (
              <div className="border-sage-200 bg-sage-50 mb-1 rounded-xl border px-4 py-3">
                <p className="text-forest flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                  <PackageCheck className="size-4" aria-hidden="true" />
                  Tổng cần chuẩn bị cho đơn này
                </p>
                <ul className="mt-2 space-y-1">
                  {summary.map((s) => (
                    <li key={s.name} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-ink">{s.name}</span>
                      <span className="text-forest text-base font-semibold whitespace-nowrap tabular-nums">
                        {s.count} {s.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          <dl className="border-forest/10 mt-2 space-y-1.5 border-t pt-3 text-sm">
            <div className="text-ink-soft flex justify-between">
              <dt>Tạm tính</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="text-ink-soft flex justify-between">
              <dt>Phí vận chuyển</dt>
              <dd className="tabular-nums">
                {order.shippingFee ? formatPrice(order.shippingFee) : "Miễn phí"}
              </dd>
            </div>
            <div className="text-forest flex justify-between pt-1 text-base font-semibold">
              <dt>{isTransfer(order) ? "Tổng tiền (chuyển khoản)" : "Tổng thu (COD)"}</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-pearl rounded-2xl p-5">
          <h3 className="eyebrow">Trạng thái đơn</h3>
          <div className="mt-4">
            <StatusPicker value={status} onChange={setStatus} />
          </div>

          <label className="mt-5 block">
            <span className="text-ink mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
              <StickyNote className="text-sage-600 size-4" aria-hidden="true" /> Ghi chú nội bộ
            </span>
            <Textarea
              rows={3}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách hẹn giao sau 17h, đã gọi xác nhận lúc 9h…"
            />
            <span className="text-ink-muted mt-1 block text-xs">Chỉ quản trị viên thấy.</span>
          </label>
        </section>

        {(() => {
          // trạng thái đơn + xác nhận thanh toán, gộp thành 1 dòng thời gian (mới nhất trên cùng)
          const events = [
            ...(order.statusHistory ?? []).map((h) => ({
              at: h.at,
              label: ORDER_STATUS[h.status]?.label,
              pay: false,
            })),
            ...(order.paymentHistory ?? []).map((h) => ({
              at: h.at,
              label: h.status === "paid" ? "Xác nhận đã thanh toán" : "Bỏ xác nhận thanh toán",
              pay: true,
            })),
          ].sort((a, b) => new Date(b.at) - new Date(a.at));
          if (!events.length) return null;
          return (
            <section className="px-1">
              <h3 className="eyebrow">Lịch sử</h3>
              <ol className="border-forest/15 mt-3 space-y-3 border-l pl-4">
                {events.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span
                      className={cn(
                        "absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-[var(--color-linen)]",
                        h.pay ? "bg-emerald-500" : "bg-sage-500",
                      )}
                    />
                    <span
                      className={cn("font-semibold", h.pay ? "text-emerald-800" : "text-forest")}
                    >
                      {h.label}
                    </span>
                    <span className="text-ink-muted ml-2 text-xs">{dateTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })()}
      </div>
    </Drawer>
  );
}

export default function OrdersPage() {
  const list = useAdminList("/orders");
  const [stats, reloadStats] = useStats("/orders");
  const [selected, setSelected] = useState(null);

  const confirm = useConfirm();
  const toast = useToast();

  const onSaved = (order) => {
    list.setItems((items) => items.map((o) => (o.id === order.id ? order : o)));
    setSelected(order);
    reloadStats();
  };

  const remove = async (order) => {
    const ok = await confirm({
      title: `Xóa đơn ${order.code}?`,
      message: `Đơn của ${order.customer.name} (${formatPrice(order.total)}) bị xóa vĩnh viễn, không khôi phục được.`,
      confirmLabel: "Xóa đơn",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/orders/${order.id}`, { method: "DELETE" });
      setSelected(null);
      // xóa dòng cuối của trang (không phải trang 1) → lùi 1 trang, tránh trang trống
      if (list.items.length === 1 && list.meta?.page > 1) list.setPage(list.meta.page - 1);
      else list.setItems((items) => items.filter((o) => o.id !== order.id));
      reloadStats();
      toast(`Đã xóa đơn ${order.code}`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Bán hàng" title="Đơn hàng" />

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          value={list.params.status ?? ""}
          onChange={(status) => list.update({ status })}
          items={statusTabs(ORDER_STATUS, stats)}
        />
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          {/* lọc theo thanh toán — "Chuyển khoản – chờ nhận tiền" là danh sách cần đối chiếu sao kê */}
          <Select
            aria-label="Lọc theo thanh toán"
            value={list.params.payment ?? ""}
            onChange={(e) => list.update({ payment: e.target.value })}
            options={PAYMENT_FILTERS.map((f) =>
              f.value === "awaiting" && stats?.awaitingPayment
                ? { ...f, label: `${f.label} (${stats.awaitingPayment})` }
                : f,
            )}
            className="w-full py-2 sm:w-auto lg:w-60"
          />
          <SearchBox
            key={list.searchKey}
            defaultValue={list.params.q ?? ""}
            placeholder="Mã đơn, SĐT, tên khách…"
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

      {/* nhắc việc: có đơn chuyển khoản đang chờ đối chiếu → bấm để lọc ra */}
      {stats?.awaitingPayment > 0 && list.params.payment !== "awaiting" && (
        <button
          type="button"
          onClick={() => list.update({ payment: "awaiting" })}
          className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 transition-colors hover:bg-amber-100"
        >
          <Landmark className="size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{stats.awaitingPayment} đơn chuyển khoản</strong> đang chờ kiểm tra tiền về —
            bấm để xem và đối chiếu sao kê.
          </span>
        </button>
      )}

      <ErrorNote error={list.error} className="mt-4" />

      <div className="mt-4">
        <TableShell
          loading={list.loading}
          empty={emptyMessage(list, "Chưa có đơn hàng nào.")}
          footer={
            <Pagination
              meta={list.meta}
              onPage={list.setPage}
              onLimit={list.setLimit}
              noun="đơn hàng"
            />
          }
        >
          <table className="w-full text-sm">
            <thead className="border-forest/10 border-b">
              <tr>
                <th className={th}>Mã đơn</th>
                <th className={th}>Khách hàng</th>
                <th className={thc}>Sản phẩm</th>
                <th className={thc}>Tổng tiền</th>
                <th className={thc}>Trạng thái</th>
                <th className={thc}>Ngày đặt</th>
                <th className={thc}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-forest/10 divide-y">
              {list.items.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="hover:bg-sage-50/60 cursor-pointer transition-colors"
                >
                  <td className={cn(td, "text-forest font-semibold whitespace-nowrap")}>
                    {o.code}
                    {o.adminNote && (
                      <StickyNote
                        className="text-sage-500 ml-1.5 inline size-3.5"
                        aria-label="Có ghi chú"
                      />
                    )}
                  </td>
                  <td className={td}>
                    <span
                      className="text-ink block max-w-44 truncate font-medium"
                      title={o.customer.name}
                    >
                      {o.customer.name}
                      {o.lang === "en" && (
                        <span
                          title="Khách xem trang tiếng Anh — tư vấn bằng tiếng Anh"
                          className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-800"
                        >
                          EN
                        </span>
                      )}
                    </span>
                    <span className="text-ink-muted text-xs">{o.customer.phone}</span>
                  </td>
                  {/* căn giữa như các cột số liệu; đọc giống khung chi tiết ("Cần chuẩn bị"):
                      sản phẩm lẻ 1 dòng "2 lọ Mayqueen Slim"; combo "Combo 3 × 2" + tổng món cần lấy */}
                  <td className={cn(tdc, "text-ink-soft")}>
                    <div className="mx-auto max-w-72 space-y-1.5">
                      {o.lines.map((l) => {
                        const combo = isComboNote(l.optionNote);
                        const need = packText(l);
                        return (
                          <div
                            key={`${l.slug}:${l.optionId}`}
                            title={`${l.name} — ${l.optionLabel} × ${l.qty}`}
                            className="text-xs"
                          >
                            <span className="text-ink block truncate font-medium">
                              {combo ? (
                                <>
                                  {l.optionLabel} <span className="text-ink-muted">× {l.qty}</span>
                                </>
                              ) : (
                                need
                              )}
                            </span>
                            {combo && (
                              <span className="text-ink-muted block truncate text-[11px]">
                                {need}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td
                    className={cn(tdc, "text-forest font-semibold whitespace-nowrap tabular-nums")}
                  >
                    {formatPrice(o.total)}
                    <span className="mt-1 block">
                      <PaymentBadge order={o} />
                    </span>
                  </td>
                  <td className={tdc}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={cn(tdc, "text-ink-muted text-xs whitespace-nowrap")}>
                    {dateTime(o.createdAt)}
                  </td>
                  {/* bấm nút không mở ngăn chi tiết đơn */}
                  <td className={tdc} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      label={canDelete(o) ? "Xóa đơn" : DELETE_HINT}
                      disabled={!canDelete(o)}
                      onClick={() => remove(o)}
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

      {/* key: mỗi đơn 1 bản form riêng (trạng thái / ghi chú nạp lại đúng đơn đang mở) */}
      <OrderDrawer
        key={selected?.id ?? "none"}
        order={selected}
        onClose={() => setSelected(null)}
        onSaved={onSaved}
        onDelete={remove}
      />
    </div>
  );
}
