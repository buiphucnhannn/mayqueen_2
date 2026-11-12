"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Honeypot from "@/components/forms/Honeypot";
import Image from "@/components/ui/Img";
import { BadgePercent, Banknote, Check, CheckCircle2, ShoppingBag, Trash2 } from "lucide-react";
import QtyStepper from "@/components/cart/QtyStepper";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { href } from "@/i18n";
import { api } from "@/lib/api";
import ConsentCheckbox, { consentPayload } from "@/components/forms/ConsentCheckbox";
import {
  NAME_MAX,
  cleanName,
  cn,
  formatPrice,
  isValidPhone,
  nameProblem,
  phoneInput,
} from "@/lib/utils";

const initial = { name: "", phone: "", address: "", province: "", note: "" };
const LAST_ORDER = "mq_last_order"; // sessionStorage: đơn vừa đặt (hiện lại khi tải lại trang thành công)

// Thông báo lỗi riêng của trang đặt hàng (theo ngôn ngữ trang)
const MESSAGES = {
  vi: {
    network:
      "Mạng chậm hoặc mất kết nối nên chưa nhận được xác nhận. Vui lòng bấm “Đặt hàng” lại — hệ thống không tạo trùng đơn — hoặc gọi hotline {phone}.",
    priceChanged:
      "Giá sản phẩm vừa được cập nhật, tổng thanh toán mới là {total}. Vui lòng kiểm tra lại đơn rồi bấm “Đặt hàng” để xác nhận.",
    unavailable:
      "Sản phẩm sau vừa ngừng bán nên đã được bỏ khỏi giỏ: {items}. Vui lòng kiểm tra lại đơn trước khi đặt.",
    track: "Tra cứu đơn hàng",
    remove: "Bỏ khỏi đơn",
  },
  en: {
    network:
      "Your connection is slow or offline, so we couldn't confirm your order. Please press “Place order” again — you won't be charged twice — or call {phone}.",
    priceChanged:
      "Prices were just updated; your new total is {total}. Please review your order and press “Place order” to confirm.",
    unavailable:
      "These items are no longer available and were removed from your cart: {items}. Please review your order.",
    track: "Track this order",
    remove: "Remove from order",
  },
};

const noopSubscribe = () => () => {};

/** Mã ngẫu nhiên cho 1 lần đặt hàng (chống trùng đơn khi gửi lại) */
const newKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

// Trang đặt hàng: thông tin giao hàng + hình thức thanh toán (chỉ COD) + tóm tắt đơn. Gửi tới backend POST /api/v1/orders (be/).
export default function CheckoutForm({ labels }) {
  const { lang, lines, subtotal, saved, shipping, total, setQty, clear } = useCart();
  const [values, setValues] = useState(initial);
  // ô "Tôi đồng ý … Chính sách bảo mật / đổi trả" — KHÔNG tick sẵn (luật yêu cầu khách chủ động đồng ý)
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [order, setOrder] = useState(null);
  const [formError, setFormError] = useState("");
  // Đã đặt xong (giỏ trống) → đi mua tiếp rồi "Mua ngay" quay lại: component được dùng lại nên vẫn giữ
  // màn "thành công" cũ. Giỏ có hàng trở lại = đơn mới → trả về form đặt hàng.
  if (order && lines.length > 0) {
    setOrder(null);
    setStatus("idle"); // mở khoá nút "Đặt hàng" cho đơn mới (đơn trước giữ ở trạng thái "đang gửi")
  }

  const set = (key) => (e) => {
    // ô SĐT: chỉ nhận số, + và ký tự ngăn cách (chữ, HTML, emoji bị loại ngay khi gõ / dán)
    const value = key === "phone" ? phoneInput(e.target.value) : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const honeypot = useRef(null);
  // Khóa gửi bằng ref (đổi NGAY, không chờ React vẽ lại) → bấm 2 lần thật nhanh cũng chỉ tạo 1 đơn
  const locked = useRef(false);
  const attempt = useRef(null); // { sig, key } — mã chống trùng của lần đặt hiện tại
  const [accepted, setAccepted] = useState(null); // { sig, total } — tổng mới khách đã được báo
  const router = useRouter();
  const msg = MESSAGES[lang] ?? MESSAGES.vi;
  // false khi render ở server / lần vẽ đầu, true sau khi trình duyệt nhận trang (giỏ hàng đã đọc được)
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // Đã đặt xong rồi tải lại trang → hiện lại màn "Đặt hàng thành công" kèm mã đơn (giữ 30 phút trong tab này)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc sessionStorage chỉ làm được sau khi mount
      if (saved && Date.now() - saved.at < 30 * 60 * 1000) setOrder(saved);
    } catch {}
  }, []);

  // Đặt xong → cuộn tới ngay khối "Đặt hàng thành công" (mã đơn + tổng tiền). Trước đây cuộn lên đầu trang:
  // điện thoại chỉ thấy ảnh bìa "Điền thông tin giao hàng…", khách phải tự cuộn mới thấy mã đơn.
  const successRef = useRef(null);
  useEffect(() => {
    if (!order || !successRef.current) return;
    const y = successRef.current.getBoundingClientRect().top + window.scrollY - 110;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y });
    successRef.current.focus({ preventScroll: true });
  }, [order]);

  /** Lỗi ở ô nào → cuộn tới + đặt con trỏ vào ô đầu tiên (điện thoại: lỗi thường nằm ngoài màn hình) */
  const focusField = (key) =>
    requestAnimationFrame(() => {
      const el = document.getElementById(`co-${key}`);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.6 });
      else window.scrollTo({ top: y, behavior: "smooth" });
      el.focus({ preventScroll: true });
    });

  const submit = async (e) => {
    e.preventDefault();
    if (locked.current || status === "sending") return; // chặn bấm đặt hàng 2 lần
    setFormError(""); // bỏ thông báo lỗi của lần bấm trước (không hiện 2 lỗi cùng lúc)
    const next = {};
    const problem = nameProblem(values.name);
    if (problem)
      next.name = { empty: labels.required, short: labels.nameShort, invalid: labels.nameInvalid }[
        problem
      ];
    if (!isValidPhone(values.phone)) next.phone = labels.phoneError;
    if (!values.address.trim()) next.address = labels.required;
    if (!agree) next.consent = true;
    setErrors(next);
    if (Object.keys(next).length) return focusField(Object.keys(next)[0]);

    const items = lines.map(({ slug, optionId, qty }) => ({ slug, optionId, qty }));
    // Mã chống trùng đơn: giữ nguyên khi khách bấm lại sau lỗi mạng (backend trả đơn đã tạo, không tạo đơn 2),
    // đổi mã khi giỏ hàng đổi (là đơn khác)
    const sig = JSON.stringify(items);
    if (attempt.current?.sig !== sig) attempt.current = { sig, key: newKey() };
    // Khách đã được báo giá mới (lỗi PRICE_CHANGED) và bấm đặt lại → đồng ý với tổng mới đó
    const expectedTotal = accepted?.sig === sig ? accepted.total : total;

    locked.current = true;
    setStatus("sending");
    setFormError("");
    try {
      const res = await api("/orders", {
        method: "POST",
        timeout: 25_000,
        body: {
          customer: { ...values, name: cleanName(values.name), phone: values.phone.trim() },
          items,
          lang,
          consent: consentPayload(),
          idempotencyKey: attempt.current.key,
          expectedTotal,
          website: honeypot.current?.value ?? "",
        },
      });
      // giữ SĐT để link "Tra cứu đơn hàng" điền sẵn cả mã đơn lẫn SĐT (khách không phải gõ lại)
      const placed = { ...res.data, phone: values.phone.trim() };
      setOrder(placed);
      locked.current = false; // màn "thành công" đã thay form → mở khoá sẵn cho lần mua sau
      attempt.current = null;
      setAccepted(null);
      try {
        sessionStorage.setItem(LAST_ORDER, JSON.stringify({ ...placed, at: Date.now() }));
      } catch {}
      clear();
      setAgree(false); // đơn sau khách tick lại (mỗi lần gửi thông tin = 1 lần đồng ý)
    } catch (err) {
      locked.current = false;
      setStatus("error");
      // backend kiểm tra lại cùng luật → báo đúng ô sai, câu chữ theo ngôn ngữ trang
      const fields = new Set((Array.isArray(err.details) ? err.details : []).map((d) => d.field));
      // backend bắt buộc có đồng ý Chính sách bảo mật / đổi trả → báo ngay ở ô tick
      if (err.status === 422 && [...fields].some((f) => f.startsWith("body.consent"))) {
        setAgree(false);
        setErrors({ consent: true });
        focusField("consent");
      } else if (
        err.status === 422 &&
        (fields.has("body.customer.name") || fields.has("body.customer.phone"))
      ) {
        setErrors({
          ...(fields.has("body.customer.name") && { name: labels.nameInvalid }),
          ...(fields.has("body.customer.phone") && { phone: labels.phoneError }),
        });
        focusField(fields.has("body.customer.name") ? "name" : "phone");
      } else if (err.code === "ITEM_UNAVAILABLE") {
        // Món vừa ngừng bán / bị ẩn → bỏ khỏi giỏ, nói rõ món nào, tải lại dữ liệu sản phẩm mới nhất
        const gone = err.details.map((d) => `${d.slug}:${d.optionId}`);
        const names = lines.filter((l) => gone.includes(l.key)).map((l) => l.name);
        err.details.forEach((d) => setQty(d.slug, d.optionId, 0));
        router.refresh();
        setFormError(msg.unavailable.replace("{items}", names.join(", ") || "—"));
      } else if (err.code === "PRICE_CHANGED") {
        // Giá vừa đổi → không tự đặt với số tiền khác: báo tổng mới, khách bấm lại = đồng ý
        setAccepted({ sig, total: err.details.total });
        router.refresh();
        setFormError(msg.priceChanged.replace("{total}", formatPrice(err.details.total, lang)));
      } else if (err.status === 0)
        // mất mạng / quá lâu: đơn CÓ THỂ đã lưu → bấm lại an toàn nhờ mã chống trùng
        setFormError(msg.network.replace("{phone}", siteConfig.phone));
      else setFormError(err.status === 429 ? labels.rateLimited : labels.error);
    }
  };

  if (order)
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="mx-auto max-w-lg py-10 text-center outline-none"
        role="status"
      >
        <span className="bg-leaf-soft text-sage-700 mx-auto grid size-20 [animation:popIn_.5s_ease-out] place-items-center rounded-full">
          <CheckCircle2 className="size-10" aria-hidden="true" />
        </span>
        <h2 className="h-display mt-6 text-4xl">{labels.thanks}</h2>
        <p className="text-ink-soft mt-3">{labels.thanksText}</p>
        <p className="bg-sage-50 mt-6 inline-block rounded-full px-5 py-2 text-sm">
          {labels.orderId}: <strong className="text-forest">{order.orderId}</strong> -{" "}
          {formatPrice(order.total, lang)}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={href(lang, "/san-pham")} arrow>
            {labels.continue}
          </Button>
          <Button href={href(lang, "/")} variant="outline">
            {labels.backHome}
          </Button>
        </div>
        <a
          href={`${href(lang, "/tra-cuu-don-hang")}?ma=${encodeURIComponent(order.orderId)}${order.phone ? `&sdt=${encodeURIComponent(order.phone)}` : ""}`}
          className="text-sage-700 hover:text-forest mt-6 inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          {msg.track} →
        </a>
      </div>
    );

  // Trước khi đọc xong giỏ hàng (localStorage) → khung chờ, tránh chớp màn "Giỏ hàng trống" khi tải lại trang
  if (!hydrated)
    return (
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14" aria-busy="true">
        <div className="bg-pearl/70 shadow-card h-96 animate-pulse rounded-lg" />
        <div className="bg-pearl/70 shadow-card h-80 animate-pulse rounded-lg" />
      </div>
    );

  if (lines.length === 0)
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="bg-sage-100 text-sage-600 grid size-20 place-items-center rounded-full">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </span>
        <p className="text-forest mt-5 font-serif text-3xl">{labels.empty}</p>
        <Button href={href(lang, "/san-pham")} arrow className="mt-6">
          {labels.continue}
        </Button>
      </div>
    );

  const field = (key, props = {}) => (
    <div className={props.wrapClass}>
      <label htmlFor={`co-${key}`} className="text-ink-soft mb-1.5 block pl-1 text-sm font-medium">
        {labels[key]}
        {props.required && <span className="text-sage-600"> *</span>}
      </label>
      <input
        id={`co-${key}`}
        value={values[key]}
        onChange={set(key)}
        required={props.required}
        aria-required={props.required || undefined}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `co-${key}-error` : undefined}
        className={cn("field", errors[key] && "border-red-400")}
        {...props.input}
      />
      {errors[key] && (
        <p id={`co-${key}-error`} className="mt-1.5 pl-2 text-xs text-red-600">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      <Honeypot ref={honeypot} />
      <div className="space-y-8">
        <fieldset className="reveal bg-pearl shadow-card rounded-lg p-6 sm:p-8">
          <legend className="sr-only">{labels.shippingInfo}</legend>
          <h2 className="text-forest font-serif text-2xl">{labels.shippingInfo}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {field("name", {
              required: true,
              input: { autoComplete: "name", maxLength: NAME_MAX },
            })}
            {field("phone", {
              required: true,
              input: { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 16 },
            })}
            {field("address", {
              required: true,
              wrapClass: "sm:col-span-2",
              input: { autoComplete: "street-address", maxLength: 300 },
            })}
            {field("province", {
              wrapClass: "sm:col-span-2",
              input: { autoComplete: "address-level1", maxLength: 120 },
            })}
            <div className="sm:col-span-2">
              <label
                htmlFor="co-note"
                className="text-ink-soft mb-1.5 block pl-1 text-sm font-medium"
              >
                {labels.note}
              </label>
              <textarea
                id="co-note"
                rows={3}
                maxLength={1000}
                value={values.note}
                onChange={set("note")}
                className="field resize-none"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="reveal bg-pearl shadow-card rounded-lg p-6 sm:p-8">
          <legend className="sr-only">{labels.payment}</legend>
          <h2 className="text-forest font-serif text-2xl">{labels.payment}</h2>
          {/* Chỉ một hình thức: thanh toán khi nhận hàng — hiển thị dạng thẻ thông tin (không cần chọn) */}
          <div className="border-sage-600 bg-sage-50 mt-5 flex items-center gap-4 rounded-3xl border-2 p-4">
            <span className="bg-sage-100 text-sage-700 grid size-11 shrink-0 place-items-center rounded-full">
              <Banknote className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-forest block font-semibold">{labels.cod}</span>
              <span className="text-ink-muted block text-xs">{labels.codNote}</span>
            </span>
            <span className="bg-sage-600 grid size-6 shrink-0 place-items-center rounded-full text-white">
              <Check className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div
          style={{ "--reveal-delay": "150ms" }}
          className="reveal bg-pearl shadow-card text-ink rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-forest font-serif text-2xl">{labels.summary}</h2>
          <ul className="divide-forest/10 mt-5 divide-y">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-4 py-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-forest text-sm leading-snug font-semibold">{l.name}</p>
                  <p className="text-ink-muted text-xs">
                    {l.optionLabel}
                    {l.optionNote && <span className="block">{l.optionNote}</span>}
                  </p>
                  {/* tối thiểu 1 (bấm "−" không vô tình xoá món + mất form); xoá bằng nút thùng rác rõ ràng */}
                  <div className="mt-2 flex items-center gap-2">
                    <QtyStepper
                      size="sm"
                      value={l.qty}
                      onChange={(q) => setQty(l.slug, l.optionId, q)}
                      className="text-forest"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(l.slug, l.optionId, 0)}
                      aria-label={`${msg.remove}: ${l.name}`}
                      title={msg.remove}
                      className="text-ink-muted hover:bg-sage-100 hover:text-forest grid size-8 place-items-center rounded-full transition"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {/* giá đã giảm + giá gốc gạch ngang → khách thấy khoản tiết kiệm nằm ngay trong giá món.
                    Giá bán NGANG HÀNG tên sản phẩm (cùng cỡ chữ / dòng), giá gạch ngay bên dưới */}
                <span className="flex shrink-0 flex-col items-end self-start">
                  <span className="text-forest text-sm leading-snug font-semibold whitespace-nowrap">
                    {formatPrice(l.price * l.qty, lang)}
                  </span>
                  {l.compareAt > l.price && (
                    <s className="text-ink-muted mt-0.5 text-xs whitespace-nowrap">
                      {formatPrice(l.compareAt * l.qty, lang)}
                    </s>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <dl className="border-forest/10 space-y-2 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{labels.subtotal}</dt>
              <dd>{formatPrice(subtotal, lang)}</dd>
            </div>
            {/* Tiết kiệm = ĐÃ trừ sẵn trong giá từng món (Tạm tính đã là giá sau giảm) → không ghi dấu "−",
                kèm ghi chú để khách không hiểu nhầm là sẽ trừ thêm vào tổng */}
            {saved > 0 && (
              <div className="bg-sage-50 text-sage-800 rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 font-medium">
                    <BadgePercent className="size-4 shrink-0" aria-hidden="true" />
                    {labels.saved}
                  </dt>
                  <dd className="font-semibold">{formatPrice(saved, lang)}</dd>
                </div>
                <p className="text-sage-700/90 mt-1 pl-6 text-xs leading-relaxed">
                  {labels.savedNote}
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">{labels.shipping}</dt>
              <dd>{shipping === 0 ? labels.free : formatPrice(shipping, lang)}</dd>
            </div>
            {/* chưa đủ ngưỡng miễn phí vận chuyển → nhắc số tiền còn thiếu (giống giỏ hàng) */}
            {shipping > 0 && (
              <p className="bg-sage-50 text-sage-800 -mt-1 rounded-xl px-3 py-2 text-xs leading-relaxed">
                {(lang === "en"
                  ? "Add {amount} more to get free shipping."
                  : "Mua thêm {amount} để được miễn phí vận chuyển."
                ).replace("{amount}", formatPrice(siteConfig.freeShipThreshold - subtotal, lang))}
              </p>
            )}
            <div className="border-forest/10 flex items-baseline justify-between border-t pt-4">
              <dt className="text-forest font-semibold">{labels.total}</dt>
              <dd className="text-forest font-serif text-3xl">{formatPrice(total, lang)}</dd>
            </div>
          </dl>
          {status === "error" && formError && (
            <p
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {formError}
            </p>
          )}
          <ConsentCheckbox
            id="co-consent"
            lang={lang}
            purpose="order"
            checked={agree}
            onChange={(v) => {
              setAgree(v);
              if (errors.consent) setErrors((x) => ({ ...x, consent: undefined }));
            }}
            error={!!errors.consent}
            className="mt-6"
          />
          <Button
            type="submit"
            size="lg"
            arrow
            className="mt-5 w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? labels.sending : labels.placeOrder}
          </Button>
          <p className="text-ink-muted mt-3 text-center text-xs">{labels.secure}</p>
        </div>
      </aside>
    </form>
  );
}
