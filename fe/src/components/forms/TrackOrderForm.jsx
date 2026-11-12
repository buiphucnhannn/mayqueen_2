"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, PackageSearch, Phone, XCircle } from "lucide-react";
import BankTransferPanel from "@/components/payment/BankTransferPanel";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { optionForQty } from "@/lib/pack";
import { cn, formatPrice, isValidPhone, phoneInput } from "@/lib/utils";

const STEPS = ["pending", "confirmed", "shipping", "completed"];
// Mã đơn: chữ in hoa + số (VD MQ7K2P9X) — độ dài khớp orderCodeParam ở be/src/validators/order.validator.js
const CODE_RX = /^[A-Z0-9-]{4,20}$/;
/** Ô mã đơn: tự in hoa, bỏ mọi khoảng trắng (khách hay dán kèm dấu cách / xuống dòng từ tin nhắn) */
const cleanCode = (v = "") => String(v).toUpperCase().replace(/\s+/g, "");

/** Ngày giờ đặt hàng theo giờ Việt Nam: vi "05/11/2026 14:30" · en "05 Nov 2026, 14:30" */
const formatDateTime = (iso, lang) => {
  const d = new Date(iso);
  const opts = { timeZone: "Asia/Ho_Chi_Minh" };
  const locale = lang === "en" ? "en-GB" : "vi-VN";
  // ghép tay "ngày + giờ": Intl tiếng Việt tự đặt giờ TRƯỚC ngày ("14:30 05/11/2026") — khó đọc
  const date = new Intl.DateTimeFormat(locale, {
    ...opts,
    day: "2-digit",
    month: lang === "en" ? "short" : "2-digit",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat(locale, {
    ...opts,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return lang === "en" ? `${date}, ${time}` : `${date} lúc ${time}`;
};

/**
 * Tra cứu đơn hàng: khách nhập mã đơn + SĐT đặt hàng → GET /api/v1/orders/track/:code?phone= (be/).
 * Điền sẵn từ đường dẫn ?ma=MQXXXX&sdt=09… (VD link trên màn "Đặt hàng thành công").
 */
export default function TrackOrderForm({ lang, labels, hotline }) {
  const [values, setValues] = useState({ code: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [formError, setFormError] = useState("");
  const [order, setOrder] = useState(null);
  const locked = useRef(false);
  const resultRef = useRef(null);

  const set = (key) => (e) => {
    const value = key === "phone" ? phoneInput(e.target.value) : cleanCode(e.target.value);
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  /** Lỗi ở ô nào → đặt con trỏ vào ô đó */
  const focusField = (key) =>
    requestAnimationFrame(() => document.getElementById(`tr-${key}`)?.focus());

  /** Có kết quả → cuộn tới (điện thoại: kết quả nằm dưới form, ngoài màn hình) */
  const showResult = () =>
    requestAnimationFrame(() => {
      const el = resultRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top > 0 && top < window.innerHeight * 0.6) return; // đã thấy rõ → không cuộn
      const y = top + window.scrollY - 120;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.6 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    });

  const lookup = async ({ code, phone }) => {
    const next = {};
    if (!CODE_RX.test(code)) next.code = labels.codeError;
    if (!isValidPhone(phone)) next.phone = labels.phoneError;
    setErrors(next);
    setFormError(""); // bỏ thông báo của lần tra trước → không hiện 2 lỗi cùng lúc
    if (Object.keys(next).length) {
      setStatus("idle");
      return focusField(Object.keys(next)[0]);
    }

    locked.current = true;
    setStatus("sending");
    try {
      const res = await api(
        `/orders/track/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone.trim())}`,
        { timeout: 20_000 },
      );
      setOrder(res.data);
      setStatus("idle");
      showResult();
    } catch (err) {
      setStatus("error");
      setOrder(null);
      const fields = new Set((err.details ?? []).map((d) => d.field));
      if (err.status === 422 && (fields.has("params.code") || fields.has("query.phone"))) {
        // backend kiểm tra lại cùng luật → báo đúng ô sai
        setErrors({
          ...(fields.has("params.code") && { code: labels.codeError }),
          ...(fields.has("query.phone") && { phone: labels.phoneError }),
        });
        focusField(fields.has("params.code") ? "code" : "phone");
      } else if (err.status === 404) setFormError(labels.notFound);
      else if (err.status === 429) {
        const minutes = Math.max(1, Math.ceil((Number(err.retryAfter) || 15 * 60) / 60));
        setFormError(labels.rateLimited.replace("{minutes}", minutes));
      } else setFormError(labels.error);
    } finally {
      locked.current = false;
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (locked.current) return; // chặn bấm 2 lần
    lookup(values);
  };

  /** Giá trị từ đường dẫn: điền vào ô; đủ mã đơn + SĐT hợp lệ → tra cứu luôn, khách không phải bấm */
  const prefill = useRef(false);
  const onQuery = ({ code, phone }) => {
    if (prefill.current || (!code && !phone)) return;
    prefill.current = true;
    setValues({ code, phone });
    if (CODE_RX.test(code) && isValidPhone(phone)) lookup({ code, phone });
  };

  const field = (key, input, hint) => {
    const errId = `tr-${key}-err`;
    const hintId = hint ? `tr-${key}-hint` : undefined;
    return (
      <div>
        <label
          htmlFor={`tr-${key}`}
          className="text-ink-soft mb-1.5 block pl-1 text-sm font-medium"
        >
          {labels[key]}
          <span className="text-sage-600"> *</span>
        </label>
        <input
          id={`tr-${key}`}
          value={values[key]}
          onChange={set(key)}
          required
          aria-required
          aria-invalid={!!errors[key]}
          aria-describedby={cn(errors[key] && errId, hintId) || undefined}
          className={cn("field", errors[key] && "border-red-400")}
          {...input}
        />
        {errors[key] && (
          <p id={errId} className="mt-1.5 pl-2 text-xs text-red-600">
            {errors[key]}
          </p>
        )}
        {hint && !errors[key] && (
          <p id={hintId} className="text-ink-muted mt-1.5 pl-2 text-xs">
            {hint}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
      {/* useSearchParams phải nằm trong <Suspense> (cacheComponents) → tách riêng 1 component không vẽ gì:
          form vẫn có trong HTML tĩnh, không bị vẽ lại 2 lần (bản tạm rồi bản thật → "giật") */}
      <Suspense fallback={null}>
        <QueryPrefill onQuery={onQuery} />
      </Suspense>
      <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
        <form
          onSubmit={submit}
          noValidate
          className="reveal bg-pearl shadow-card rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-forest font-serif text-2xl">{labels.formTitle}</h2>
          <div className="mt-6 grid gap-4">
            {field(
              "code",
              {
                autoComplete: "off",
                autoCapitalize: "characters",
                spellCheck: false,
                maxLength: 20,
                placeholder: "MQ…",
              },
              labels.codeHint,
            )}
            {field("phone", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 16 })}
          </div>
          {status === "error" && formError && (
            <p
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {formError}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            arrow
            className="mt-6 w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? labels.sending : labels.submit}
          </Button>
        </form>

        {/* Hotline: khách cần hỏi thêm / đổi thông tin đơn → gọi ngay */}
        <div
          style={{ "--reveal-delay": "100ms" }}
          className="reveal bg-sage-50 text-sage-800 flex items-center gap-4 rounded-lg p-6"
        >
          <span className="bg-sage-100 text-sage-700 grid size-11 shrink-0 place-items-center rounded-full">
            <Phone className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-forest font-semibold">{labels.help}</p>
            <p className="text-sage-700/90 mt-0.5 text-xs leading-relaxed">{labels.helpText}</p>
            <a
              href={`tel:${hotline.phoneRaw}`}
              className="text-forest hover:text-sage-600 mt-2 inline-block text-lg font-semibold tracking-wide transition-colors"
              aria-label={`${hotline.label}: ${hotline.phone}`}
            >
              {hotline.phone}
            </a>
          </div>
        </div>
      </div>

      <div ref={resultRef} aria-live="polite">
        {order ? (
          <OrderResult order={order} lang={lang} labels={labels} />
        ) : (
          <div
            style={{ "--reveal-delay": "150ms" }}
            className="reveal bg-pearl/60 border-forest/10 flex h-full min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
          >
            <span className="bg-sage-100 text-sage-600 grid size-16 place-items-center rounded-full">
              <PackageSearch className="size-7" aria-hidden="true" />
            </span>
            <p className="text-ink-soft mt-4 max-w-xs text-sm leading-relaxed">{labels.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Đọc ?ma=…&sdt=… rồi báo lên form (chạy 1 lần sau khi mount) */
function QueryPrefill({ onQuery }) {
  const params = useSearchParams();
  const ma = params.get("ma") ?? "";
  const sdt = params.get("sdt") ?? "";
  useEffect(() => {
    onQuery({ code: cleanCode(ma).slice(0, 20), phone: phoneInput(sdt).slice(0, 16) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onQuery tự chặn chạy lại; chỉ cần theo query
  }, [ma, sdt]);
  return null;
}

/** Kết quả: mã đơn + ngày đặt, thanh trạng thái, danh sách sản phẩm, tổng tiền */
function OrderResult({ order, lang, labels }) {
  const cancelled = order.status === "cancelled";
  const current = STEPS.indexOf(order.status);

  return (
    <div className="bg-pearl shadow-card text-ink rounded-lg p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">{labels.orderId}</p>
          <p className="text-forest font-serif text-3xl">{order.orderId}</p>
        </div>
        <p className="text-ink-soft text-sm">
          {labels.placedAt}:{" "}
          <time dateTime={order.createdAt} className="text-forest font-medium">
            {formatDateTime(order.createdAt, lang)}
          </time>
        </p>
      </div>

      <h3 className="text-forest mt-8 text-sm font-semibold">{labels.statusTitle}</h3>
      {cancelled ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
          <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{labels.cancelled}</p>
            <p className="mt-1 text-sm leading-relaxed text-red-700/90">{labels.cancelledText}</p>
          </div>
        </div>
      ) : (
        <ol className="mt-5 grid grid-cols-4">
          {STEPS.map((step, i) => {
            const done = i < current || order.status === "completed";
            const active = i === current;
            return (
              <li
                key={step}
                aria-current={active ? "step" : undefined}
                className="relative flex flex-col items-center text-center"
              >
                {/* đường nối với bước trước */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                      i <= current ? "bg-sage-600" : "bg-forest/10",
                    )}
                  />
                )}
                <span
                  className={cn(
                    // z-10: vòng tròn nằm TRÊN đường nối của bước sau (đường nối vẽ từ tâm vòng này sang tâm vòng kế)
                    "relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-semibold",
                    done && "border-sage-600 bg-sage-600 text-white",
                    active && !done && "border-forest bg-forest text-pearl ring-sage-200 ring-4",
                    !done && !active && "border-forest/15 bg-pearl text-ink-muted",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "mt-2 px-1 text-[11px] leading-tight sm:text-xs",
                    i <= current ? "text-forest font-semibold" : "text-ink-muted",
                  )}
                >
                  {labels.steps[step]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <h3 className="text-forest mt-8 text-sm font-semibold">{labels.items}</h3>
      <ul className="divide-forest/10 mt-2 divide-y">
        {order.lines.map((l, i) => {
          // giống trang thanh toán: "Combo 4 × 2" + "6 Mayqueen Slim + 4 Yodetox Extra"
          const o = optionForQty(l);
          return (
            <li key={`${l.slug}-${l.optionLabel}-${i}`} className="flex items-start gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-forest text-sm leading-snug font-semibold">{l.name}</p>
                {o.label && <p className="text-ink-muted text-xs">{o.label}</p>}
                {o.note && <p className="text-ink-muted text-xs">{o.note}</p>}
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-forest text-sm font-semibold">
                  {formatPrice(l.lineTotal ?? l.price * l.qty, lang)}
                </span>
                {/* mua từ 2 → cách tính tiền ngay dưới thành tiền */}
                {l.qty > 1 && (
                  <span className="text-ink-muted mt-0.5 text-xs whitespace-nowrap">
                    {l.qty} × {formatPrice(l.price, lang)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <dl className="border-forest/10 space-y-2 border-t pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">{labels.subtotal}</dt>
          <dd>{formatPrice(order.subtotal, lang)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">{labels.shipping}</dt>
          <dd>{order.shippingFee === 0 ? labels.free : formatPrice(order.shippingFee, lang)}</dd>
        </div>
        <div className="border-forest/10 flex items-baseline justify-between border-t pt-4">
          <dt className="text-forest font-semibold">{labels.total}</dt>
          <dd className="text-forest font-serif text-3xl">{formatPrice(order.total, lang)}</dd>
        </div>
        {order.paymentMethod && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <dt className="text-ink-soft">{labels.payment}</dt>
            <dd className="flex flex-wrap items-center justify-end gap-2">
              <span>{labels.methods[order.paymentMethod] ?? order.paymentMethod}</span>
              {order.paymentMethod === "bank_transfer" && !cancelled && (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    order.paymentStatus === "paid"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800",
                  )}
                >
                  {order.paymentStatus === "paid" ? labels.paid : labels.awaitingPayment}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
      {/* đơn chuyển khoản chưa nhận tiền → hiện lại QR (backend chỉ gửi khi còn phải thanh toán) */}
      {order.payment && (
        <BankTransferPanel
          payment={order.payment}
          lang={lang}
          className="bg-cream/50 mt-8 shadow-none"
        />
      )}
    </div>
  );
}
