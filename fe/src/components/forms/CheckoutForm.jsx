"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Honeypot from "@/components/forms/Honeypot";
import Image from "@/components/ui/Img";
import {
  BadgePercent,
  Banknote,
  Check,
  CheckCircle2,
  QrCode,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import QtyStepper from "@/components/cart/QtyStepper";
import BankTransferPanel from "@/components/payment/BankTransferPanel";
import QrReveal from "@/components/payment/QrReveal";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { href } from "@/i18n";
import { api } from "@/lib/api";
import { optionForQty } from "@/lib/pack";
import { vietQrPayload } from "@/lib/vietqr";
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
// sessionStorage: mã đơn đã cấp cho QR chuyển khoản — tải lại trang vẫn GIỮ ĐÚNG mã (khách có thể đã chuyển tiền
// với nội dung này), chỉ bỏ khi đặt xong
const TRANSFER_REF = "mq_transfer_ref";

const readStoredTransfer = () => {
  try {
    const t = JSON.parse(sessionStorage.getItem(TRANSFER_REF) ?? "null");
    return t?.code && t?.paymentRef && t?.accountNo ? t : null;
  } catch {
    return null;
  }
};
const storeTransfer = (t) => {
  try {
    if (t) sessionStorage.setItem(TRANSFER_REF, JSON.stringify(t));
    else sessionStorage.removeItem(TRANSFER_REF);
  } catch {}
};

// Thông báo lỗi riêng của trang đặt hàng (theo ngôn ngữ trang)
const MESSAGES = {
  vi: {
    placeOrderPaid: "Xác nhận đã thanh toán",
    stepsTitle: "Thanh toán chuyển khoản trong 3 bước",
    steps: [
      "Mở app ngân hàng, quét mã QR bên phải.",
      "Kiểm tra số tiền và nội dung (mã đơn) đã điền sẵn, rồi xác nhận chuyển.",
      "Quay lại đây, tick đồng ý và bấm “Xác nhận đã thanh toán”.",
    ],
    stepsNote: "Đơn chuyển khoản được miễn phí vận chuyển và gọi xác nhận trong giờ làm việc.",
    paidHint: "Bấm sau khi bạn đã chuyển khoản thành công.",
    transferLoading: "Đang tạo mã QR…",
    transferError: "Chưa tạo được mã QR.",
    retry: "Thử lại",
    transferNotReady: "Mã QR chưa sẵn sàng, vui lòng đợi giây lát rồi bấm lại.",
    refRenewed:
      "Mã thanh toán vừa được làm mới, vui lòng quét lại mã QR. Nếu bạn đã chuyển khoản theo mã cũ, hãy gọi hotline {phone} để được hỗ trợ.",
    thanksPaid:
      "Cảm ơn bạn! Chúng tôi đã nhận được xác nhận chuyển khoản, sẽ kiểm tra và gọi xác nhận đơn sớm nhất.",
    reviewQr: "Chưa chuyển khoản được? Xem lại mã QR",
    checking: "Đang kiểm tra",
    paymentReceived:
      "Cảm ơn bạn! Chúng tôi đã nhận được thanh toán. Đơn hàng đang được chuẩn bị, chuyên viên sẽ gọi xác nhận giao hàng.",
    paidBadge: "Đã nhận thanh toán",
    cancelled: "Đơn hàng này đã bị hủy. Nếu cần hỗ trợ, vui lòng gọi hotline {phone}.",
    network:
      "Mạng chậm hoặc mất kết nối nên chưa nhận được xác nhận. Vui lòng bấm “{button}” lại — hệ thống không tạo trùng đơn — hoặc gọi hotline {phone}.",
    priceChanged:
      "Giá sản phẩm vừa được cập nhật, tổng thanh toán mới là {total}. Vui lòng kiểm tra lại đơn rồi bấm “{button}” để xác nhận.",
    priceChangedBank:
      "Giá sản phẩm vừa được cập nhật, tổng mới là {total} (mã QR đã cập nhật theo). Nếu bạn đã chuyển khoản theo số tiền cũ, cứ bấm “{button}” — chúng tôi sẽ liên hệ đối soát phần chênh lệch.",
    unavailable:
      "Sản phẩm sau vừa ngừng bán nên đã được bỏ khỏi giỏ: {items}. Vui lòng kiểm tra lại đơn trước khi đặt.",
    track: "Tra cứu đơn hàng",
    remove: "Bỏ khỏi đơn",
    payUnavailable:
      "Hình thức chuyển khoản tạm thời chưa hỗ trợ. Vui lòng chọn thanh toán khi nhận hàng (COD) hoặc gọi hotline {phone}.",
    orTransfer: "Hoặc chọn chuyển khoản trước để được miễn phí vận chuyển ngay.",
  },
  en: {
    placeOrderPaid: "I've paid",
    stepsTitle: "Pay by bank transfer in 3 steps",
    steps: [
      "Open your banking app and scan the QR code on the right.",
      "Check the pre-filled amount and note (your order ID), then confirm the transfer.",
      "Come back, tick the consent box and press “I've paid”.",
    ],
    stepsNote: "Bank-transfer orders ship free; we'll call to confirm during business hours.",
    paidHint: "Press this once your bank transfer has gone through.",
    transferLoading: "Creating QR code…",
    transferError: "Couldn't create the QR code.",
    retry: "Try again",
    transferNotReady: "The QR code isn't ready yet — please wait a moment and try again.",
    refRenewed:
      "Your payment code was refreshed — please scan the new QR. If you already paid with the old code, call {phone} and we'll sort it out.",
    thanksPaid:
      "Thank you! We've received your transfer confirmation and will verify it and call you shortly.",
    reviewQr: "Haven't paid yet? Show the QR code again",
    checking: "Verifying",
    paymentReceived:
      "Thank you! We've received your payment. Your order is being prepared and we'll call to arrange delivery.",
    paidBadge: "Payment received",
    cancelled: "This order has been cancelled. Need help? Call {phone}.",
    network:
      "Your connection is slow or offline, so we couldn't confirm your order. Please press “{button}” again — you won't be charged twice — or call {phone}.",
    priceChanged:
      "Prices were just updated; your new total is {total}. Please review your order and press “{button}” to confirm.",
    priceChangedBank:
      "Prices were just updated; your new total is {total} (the QR code has been updated). If you already paid the old amount, just press “{button}” — we'll contact you to settle the difference.",
    unavailable:
      "These items are no longer available and were removed from your cart: {items}. Please review your order.",
    track: "Track this order",
    remove: "Remove from order",
    payUnavailable:
      "Bank transfer is temporarily unavailable. Please choose cash on delivery (COD) or call {phone}.",
    orTransfer: "Or pay by bank transfer first to get free shipping right away.",
  },
};

const noopSubscribe = () => () => {};

/** Mã ngẫu nhiên cho 1 lần đặt hàng (chống trùng đơn khi gửi lại) */
const newKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

/**
 * Tên hình thức thanh toán: phần trong ngoặc "(quét mã QR)" / "(COD)" giữ NGUYÊN KHỐI — màn hẹp thì cả ngoặc
 * xuống dòng cùng nhau, không bị ngắt "(quét / mã QR)".
 */
// Từ ghép tiếng Việt KHÔNG được ngắt đôi ("ngân / hàng", "nhận / hàng") → nối bằng khoảng trắng không ngắt dòng
const COMPOUNDS = [
  "Thanh toán",
  "nhận hàng",
  "Chuyển khoản",
  "ngân hàng",
  "Cash on",
  "Bank transfer",
];
const keepWords = (s) => COMPOUNDS.reduce((acc, w) => acc.replace(w, w.replace(/ /g, "\u00a0")), s);

function PayTitle({ text }) {
  const m = /^(.*?)\s*(\([^)]*\))$/.exec(text ?? "");
  if (!m) return keepWords(text ?? "");
  return (
    <>
      {keepWords(m[1])} <span className="whitespace-nowrap">{m[2]}</span>
    </>
  );
}

const PAY_COD = "cod";
const PAY_BANK = "bank_transfer";

// Trang đặt hàng: thông tin giao hàng + hình thức thanh toán (COD / chuyển khoản VietQR) + tóm tắt đơn.
// Gửi tới backend POST /api/v1/orders (be/) — backend tính lại giá + phí ship theo đúng luật bên dưới.
export default function CheckoutForm({ labels }) {
  const { lang, lines, subtotal, saved, shipping: codShipping, setQty, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState(PAY_COD);
  // Chuyển khoản trước → miễn phí vận chuyển; COD → theo ngưỡng freeship (giỏ hàng tính sẵn).
  // Giữ ĐỒNG BỘ với shippingFeeFor ở be/src/services/payment.service.js
  const shipping = paymentMethod === PAY_BANK ? 0 : codShipping;
  const total = subtotal + shipping;

  // Chuyển khoản: chọn là có QR NGAY (mã đơn do server cấp trước — GET /orders/bank-transfer). QR dựng tại chỗ
  // từ tổng tiền đang thấy → khách đổi số lượng là số tiền trên QR đổi theo.
  const [transfer, setTransfer] = useState({ status: "idle", data: null }); // idle | loading | ready | error
  const loadTransfer = async ({ fresh = false } = {}) => {
    const stored = !fresh && readStoredTransfer();
    if (stored) return setTransfer({ status: "ready", data: stored });
    setTransfer({ status: "loading", data: null });
    try {
      const res = await api("/orders/bank-transfer", { retry: false });
      storeTransfer(res.data);
      setTransfer({ status: "ready", data: res.data });
    } catch {
      setTransfer({ status: "error", data: null });
    }
  };
  const qrRef = useRef(null);
  const scrollToQr = useRef(false); // vừa bấm chọn chuyển khoản → cuộn tới QR khi QR đã hiện
  // vị trí cuộn TRƯỚC khi tự cuộn xuống QR → khách bấm lại COD thì cuộn mượt về đúng chỗ cũ
  const scrollBeforeQr = useRef(null);
  const smoothScrollTo = (y) => {
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };
  const selectPayment = (method) => {
    if (method === PAY_BANK && paymentMethod !== PAY_BANK) scrollToQr.current = true;
    // chuyển khoản → COD: khung QR biến mất; đã từng tự cuộn xuống QR thì cuộn về vị trí trước đó
    if (method === PAY_COD && paymentMethod === PAY_BANK && scrollBeforeQr.current !== null) {
      const back = scrollBeforeQr.current;
      scrollBeforeQr.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => smoothScrollTo(back)));
    }
    setPaymentMethod(method);
    if (method === PAY_BANK && transfer.status !== "ready" && transfer.status !== "loading")
      loadTransfer();
  };
  // Khách bấm "Chuyển khoản" → trang tự cuộn mượt xuống khung QR (để "Tổng cộng" vẫn nằm ngay phía trên),
  // tránh tình trạng bấm xong màn hình đứng yên, khách không biết QR đã hiện ở đâu.
  useEffect(() => {
    if (paymentMethod !== PAY_BANK || !scrollToQr.current) return;
    if (transfer.status === "idle" || transfer.status === "loading") return; // đợi QR / lỗi hiện ra
    scrollToQr.current = false;
    requestAnimationFrame(() => {
      const el = qrRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      // Đích: ĐÁY khung "Đơn hàng của bạn" chạm đáy màn hình (chừa 20px) → thấy trọn QR, ô đồng ý, nút
      // "Xác nhận đã thanh toán" + dòng nhắc, khung kết thúc gọn ở mép dưới.
      // Giới hạn: không kéo quá làm khung QR chui dưới thanh menu (màn thấp / điện thoại → QR nằm ngay dưới menu).
      const card = el.closest("aside")?.querySelector("button[type=submit]")?.parentElement;
      const bottom = card ? card.getBoundingClientRect().bottom : top + 600;
      const toBottom = bottom - window.innerHeight + 20; // đoạn cần kéo để đáy khung chạm đáy màn hình
      const delta = Math.min(top - 90, toBottom);
      if (Math.abs(delta) < 24) return; // đã đúng chỗ → không cuộn (tránh giật)
      scrollBeforeQr.current = window.scrollY; // nhớ chỗ cũ để bấm lại COD thì quay về
      const y = window.scrollY + delta;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    });
  }, [paymentMethod, transfer.status]);
  const transferPayment = useMemo(() => {
    const t = transfer.data;
    if (!t) return null;
    return {
      bankName: t.bankName,
      accountNo: t.accountNo,
      accountName: t.accountName,
      amount: total,
      content: t.code,
      qr: vietQrPayload({ bin: t.bin, accountNo: t.accountNo, amount: total, content: t.code }),
    };
  }, [transfer.data, total]);

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
  // chọn chuyển khoản → nút cuối đổi thành "Xác nhận đã thanh toán" (khách quét QR, chuyển xong mới bấm)
  const buttonLabel = paymentMethod === PAY_BANK ? msg.placeOrderPaid : labels.placeOrder;
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
  const placedId = order?.orderId;
  // chỉ cuộn khi có ĐƠN MỚI (theo mã đơn) — cập nhật trạng thái thanh toán bên dưới không làm trang giật
  useEffect(() => {
    if (!placedId || !successRef.current) return;
    const y = successRef.current.getBoundingClientRect().top + window.scrollY - 110;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y });
    successRef.current.focus({ preventScroll: true });
  }, [placedId]);

  // Đơn chuyển khoản đang chờ shop kiểm tra tiền → hỏi lại trạng thái (15 giây / lần + ngay khi khách quay lại
  // tab) qua API tra cứu (mã đơn + SĐT). Admin bấm "Xác nhận đã thanh toán" → màn này đổi sang "Đã nhận thanh toán".
  // Dừng khi đã nhận tiền / đơn bị hủy / quá 30 phút / tra cứu lỗi (không hỏi mãi).
  const watchPayment =
    order?.paymentMethod === PAY_BANK &&
    order.paymentStatus !== "paid" &&
    order.orderStatus !== "cancelled" &&
    Boolean(order.phone);
  const watchKey = watchPayment ? `${order.orderId}|${order.phone}` : "";
  useEffect(() => {
    if (!watchKey) return;
    const [code, phone] = watchKey.split("|");
    const startedAt = Date.now();
    let alive = true;
    let timer = null;
    const check = async () => {
      if (!alive || document.visibilityState === "hidden") return;
      try {
        const res = await api(
          `/orders/track/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone)}`,
          { retry: false },
        );
        if (!alive) return;
        const d = res.data;
        setOrder((prev) => {
          if (!prev || prev.orderId !== code) return prev;
          const next = {
            ...prev,
            paymentStatus: d.paymentStatus,
            paymentClaimed: d.paymentClaimed,
            payment: d.payment ?? prev.payment,
            orderStatus: d.status,
          };
          try {
            const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER) ?? "null");
            if (saved?.orderId === code)
              sessionStorage.setItem(LAST_ORDER, JSON.stringify({ ...saved, ...next }));
          } catch {}
          return next;
        });
      } catch {
        stop(); // không tìm thấy / bị giới hạn / lỗi mạng → thôi hỏi, giữ nguyên màn hình
      }
    };
    const stop = () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    const onVisible = () => document.visibilityState === "visible" && check();
    timer = setInterval(() => {
      if (Date.now() - startedAt > 30 * 60 * 1000) return stop();
      check();
    }, 15_000);
    document.addEventListener("visibilitychange", onVisible);
    check(); // tải lại trang → lấy trạng thái mới nhất ngay
    return stop;
  }, [watchKey]);

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

    // chuyển khoản mà chưa có mã QR (đang tạo / lỗi mạng) → chưa gửi được
    const paymentRef = paymentMethod === PAY_BANK ? transfer.data?.paymentRef : undefined;
    if (paymentMethod === PAY_BANK && !paymentRef) {
      setStatus("error");
      setFormError(msg.transferNotReady);
      if (transfer.status === "error") loadTransfer();
      return;
    }

    const items = lines.map(({ slug, optionId, qty }) => ({ slug, optionId, qty }));
    // Mã chống trùng đơn: giữ nguyên khi khách bấm lại sau lỗi mạng (backend trả đơn đã tạo, không tạo đơn 2),
    // đổi mã khi giỏ hàng, hình thức thanh toán hoặc mã chuyển khoản đổi (là đơn khác)
    const sig = JSON.stringify({ items, paymentMethod, paymentRef });
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
          paymentMethod,
          ...(paymentRef && { paymentRef }),
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
      // mã chuyển khoản đã thuộc về đơn này → đơn sau lấy mã mới
      storeTransfer(null);
      setTransfer({ status: "idle", data: null });
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
        // chuyển khoản: khách có thể ĐÃ chuyển theo số cũ → trấn an + hướng dẫn rõ (không để khách hoang mang)
        setFormError(
          (paymentMethod === PAY_BANK ? msg.priceChangedBank : msg.priceChanged)
            .replace("{total}", formatPrice(err.details.total, lang))
            .replace("{button}", buttonLabel),
        );
      } else if (err.code === "PAYMENT_METHOD_UNAVAILABLE") {
        setPaymentMethod(PAY_COD);
        setFormError(msg.payUnavailable.replace("{phone}", siteConfig.phone));
      } else if (err.code === "PAYMENT_REF_INVALID" || err.code === "PAYMENT_REF_USED") {
        // mã chuyển khoản hỏng / đã thuộc đơn khác → cấp mã mới, khách quét lại QR
        storeTransfer(null);
        loadTransfer({ fresh: true });
        setFormError(msg.refRenewed.replace("{phone}", siteConfig.phone));
      } else if (err.status === 0)
        // mất mạng / quá lâu: đơn CÓ THỂ đã lưu → bấm lại an toàn nhờ mã chống trùng
        setFormError(
          msg.network.replace("{phone}", siteConfig.phone).replace("{button}", buttonLabel),
        );
      else setFormError(err.status === 429 ? labels.rateLimited : labels.error);
    }
  };

  if (order) {
    // đơn chuyển khoản chưa nhận tiền → còn giữ thông tin chuyển khoản (thu gọn nếu khách đã báo chuyển xong)
    const cancelled = order.orderStatus === "cancelled";
    const paidOk = order.paymentMethod === PAY_BANK && order.paymentStatus === "paid" && !cancelled;
    const transfer = order.payment && order.paymentStatus !== "paid" && !cancelled;
    const claimed = transfer && order.paymentClaimed;
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className={cn(
          // khung trang (section-y) đã có lề 64–96px trên/dưới → không thêm lề riêng, kéo gọn bớt 1 chút
          // (tổng còn ~48–64px mỗi phía thay vì ~136px)
          "mx-auto -my-4 text-center outline-none sm:-my-6 lg:-my-8",
          transfer ? "max-w-3xl" : "max-w-lg",
        )}
        role="status"
      >
        <span className="bg-leaf-soft text-sage-700 mx-auto grid size-20 [animation:popIn_.5s_ease-out] place-items-center rounded-full">
          <CheckCircle2 className="size-10" aria-hidden="true" />
        </span>
        <h2 className="h-display mt-6 text-4xl">{labels.thanks}</h2>
        {/* chuyển khoản: khung rộng hơn + text-balance → câu cảm ơn đúng 2 dòng dài đều nhau */}
        <p
          className={cn(
            "text-ink-soft mx-auto mt-3",
            transfer ? "max-w-xl text-balance" : "max-w-lg",
          )}
        >
          {cancelled
            ? msg.cancelled.replace("{phone}", siteConfig.phone)
            : paidOk
              ? msg.paymentReceived
              : claimed
                ? msg.thanksPaid
                : transfer
                  ? labels.thanksTextBank
                  : labels.thanksText}
        </p>
        {/* shop đã xác nhận nhận tiền (cập nhật tự động, không cần tải lại trang) */}
        {paidOk && (
          <p className="mt-4 inline-flex [animation:popIn_.4s_ease-out] items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {msg.paidBadge}
          </p>
        )}
        <p className="bg-sage-50 mt-6 inline-block rounded-full px-5 py-2 text-sm">
          {labels.orderId}: <strong className="text-forest">{order.orderId}</strong> -{" "}
          {formatPrice(order.total, lang)}
        </p>
        {/* khách đã báo chuyển khoản → QR thu gọn (phòng khi bấm nhầm trước khi chuyển xong) */}
        {claimed ? (
          <QrReveal label={msg.reviewQr} className="mt-6">
            <BankTransferPanel
              payment={order.payment}
              lang={lang}
              badge={msg.checking}
              className="mt-4"
            />
          </QrReveal>
        ) : (
          transfer && <BankTransferPanel payment={order.payment} lang={lang} className="mt-8" />
        )}
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
  }

  // Trước khi đọc xong giỏ hàng (localStorage) → khung chờ, tránh chớp màn "Giỏ hàng trống" khi tải lại trang
  if (!hydrated)
    return (
      <div
        className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14"
        aria-busy="true"
      >
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
    <form
      onSubmit={submit}
      noValidate
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14"
    >
      <Honeypot ref={honeypot} />
      {/* Cột trái cao bằng hàng của lưới (= cột cao hơn); thẻ "Hình thức thanh toán" dãn phần còn thiếu
          → đáy 2 cột luôn bằng nhau dù giỏ nhiều hay ít món (cột phải vẫn sticky, dừng đúng đáy cột trái) */}
      <div className="flex flex-col gap-8">
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

        {/* LUÔN dãn cho đáy 2 cột bằng nhau (bấm COD ↔ chuyển khoản thẻ không co giật). Chuyển khoản: phần dãn
            thêm có hướng dẫn 3 bước bên dưới nên không bị trống */}
        <fieldset className="reveal bg-pearl shadow-card rounded-lg p-6 sm:p-8 lg:flex-1">
          <legend className="sr-only">{labels.payment}</legend>
          <h2 className="text-forest font-serif text-2xl">{labels.payment}</h2>
          {/* Lời nhắc ưu đãi: chuyển khoản trước được freeship */}
          <p className="text-sage-800 mt-2 flex items-center gap-2 text-sm">
            <Truck className="text-sage-600 size-4 shrink-0" aria-hidden="true" />
            {labels.transferTip}
          </p>
          {/* 2 thẻ chọn dạng radio thật (bàn phím: Tab vào nhóm, mũi tên để đổi) */}
          <div role="radiogroup" aria-label={labels.payment} className="mt-5 grid gap-3">
            {[
              { value: PAY_COD, Icon: Banknote, title: labels.cod, note: labels.codNote },
              {
                value: PAY_BANK,
                Icon: QrCode,
                title: labels.bank,
                note: labels.bankNote,
                badge: labels.freeShipBadge,
              },
            ].map(({ value, Icon, title, note, badge }) => {
              const active = paymentMethod === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-3xl border-2 p-3.5 transition-colors sm:gap-4 sm:p-4",
                    "has-[:focus-visible]:ring-sage-300 has-[:focus-visible]:ring-2",
                    active
                      ? "border-sage-600 bg-sage-50"
                      : "border-forest/10 hover:border-sage-300 bg-white",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={active}
                    onChange={() => selectPayment(value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full sm:size-11",
                      active ? "bg-sage-100 text-sage-700" : "bg-sage-50 text-sage-600",
                    )}
                  >
                    <Icon className="size-[18px] sm:size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-forest flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                      <PayTitle text={title} />
                      {badge && (
                        <span className="bg-leaf-soft text-forest shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="text-ink-muted block text-xs text-pretty">{note}</span>
                  </span>
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border-2",
                      active ? "border-sage-600 bg-sage-600 text-white" : "border-forest/20",
                    )}
                  >
                    {active && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Máy tính: chọn chuyển khoản → hướng dẫn 3 bước (khớp khung QR ở cột bên cạnh), lấp phần thẻ được kéo
              dài thay vì để trống. Điện thoại: QR nằm ngay bên dưới, có hướng dẫn riêng → ẩn. */}
          {paymentMethod === PAY_BANK && (
            <div className="border-forest/10 mt-6 hidden border-t pt-6 lg:block">
              <p className="text-forest text-sm font-semibold">{msg.stepsTitle}</p>
              <ol className="mt-4 space-y-3.5">
                {msg.steps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm">
                    <span className="bg-sage-100 text-sage-800 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-ink-soft pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="bg-sage-50 text-sage-800 mt-5 rounded-xl px-4 py-3 text-xs leading-relaxed">
                {msg.stepsNote}
              </p>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div
          style={{ "--reveal-delay": "150ms" }}
          className="reveal bg-pearl shadow-card text-ink rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-forest font-serif text-2xl">{labels.summary}</h2>
          <ul className="divide-forest/10 mt-5 divide-y">
            {lines.map((l) => {
              // giá đã giảm + giá gốc gạch ngang → khách thấy khoản tiết kiệm nằm ngay trong giá món
              const price = (
                <>
                  <span className="text-forest text-sm leading-snug font-semibold whitespace-nowrap">
                    {formatPrice(l.price * l.qty, lang)}
                  </span>
                  {l.compareAt > l.price && (
                    <s className="text-ink-muted mt-0.5 text-xs whitespace-nowrap">
                      {formatPrice(l.compareAt * l.qty, lang)}
                    </s>
                  )}
                </>
              );
              return (
                // Điện thoại: giá xuống HÀNG DƯỚI cạnh nút số lượng → tên sản phẩm trải hết chiều ngang (không bị ép
                // 4–5 dòng). sm+: giá ngang hàng tên như cũ.
                <li key={l.key} className="flex items-start gap-3 py-4 sm:items-center sm:gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl sm:size-16">
                    <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-forest text-sm leading-snug font-semibold text-pretty">
                      {l.name}
                    </p>
                    {/* theo số lượng: "Combo 4 × 2" + "6 Mayqueen Slim + 4 Yodetox Extra" */}
                    {(() => {
                      const o = optionForQty(l);
                      return (
                        <p className="text-ink-muted text-xs">
                          {o.label}
                          {/* tên sản phẩm trong thành phần combo không bị tách đôi ("Yodetox / Extra") */}
                          {o.note && (
                            <span className="block">
                              {o.note.replace(/Mayqueen Slim|Yodetox Extra/g, (w) =>
                                w.replace(" ", "\u00a0"),
                              )}
                            </span>
                          )}
                        </p>
                      );
                    })()}
                    {/* điện thoại: bố cục CỐ ĐỊNH cho mọi món — dòng giá riêng (giá bán đậm + giá gốc gạch ngang
                        cùng 1 dòng), rồi mới tới nút số lượng → không còn giá lúc bên phải lúc rớt xuống */}
                    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 sm:hidden [&_s]:mt-0">
                      {price}
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
                  {/* sm+: giá NGANG HÀNG tên sản phẩm, giá gạch ngay bên dưới */}
                  <span className="hidden shrink-0 flex-col items-end self-start sm:flex">
                    {price}
                  </span>
                </li>
              );
            })}
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
                ).replace(
                  "{amount}",
                  formatPrice(siteConfig.freeShipThreshold - subtotal, lang),
                )}{" "}
                <button
                  type="button"
                  onClick={() => selectPayment(PAY_BANK)}
                  className="text-forest font-semibold underline underline-offset-2"
                >
                  {msg.orTransfer}
                </button>
              </p>
            )}
            {/* chuyển khoản làm phí ship về 0 (dù chưa đủ ngưỡng) → nói rõ lý do */}
            {paymentMethod === PAY_BANK && codShipping > 0 && (
              <p className="bg-sage-50 text-sage-800 -mt-1 rounded-xl px-3 py-2 text-xs leading-relaxed">
                {labels.transferFreeShip}
              </p>
            )}
            <div className="border-forest/10 flex items-baseline justify-between border-t pt-4">
              <dt className="text-forest font-semibold">{labels.total}</dt>
              <dd className="text-forest font-serif text-3xl">{formatPrice(total, lang)}</dd>
            </div>
          </dl>
          {/* Chọn chuyển khoản → QR hiện NGAY dưới "Tổng cộng" (đúng số tiền vừa thấy), sát nút "Xác nhận đã
              thanh toán" → khách thấy liền 1 mạch: số tiền → quét QR → bấm xác nhận. Chọn xong trang tự cuộn tới đây. */}
          {paymentMethod === PAY_BANK && (
            <div ref={qrRef} className="mt-5 scroll-mt-28" aria-live="polite">
              {transfer.status === "ready" && transferPayment ? (
                <BankTransferPanel payment={transferPayment} lang={lang} variant="inline" />
              ) : transfer.status === "error" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span>{msg.transferError}</span>
                  <button
                    type="button"
                    onClick={() => loadTransfer()}
                    className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold transition-colors hover:bg-red-100"
                  >
                    {msg.retry}
                  </button>
                </div>
              ) : (
                <div className="border-sage-200 bg-sage-50/50 text-ink-muted flex h-40 animate-pulse items-center justify-center rounded-3xl border text-sm">
                  {msg.transferLoading}
                </div>
              )}
            </div>
          )}
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
            {status === "sending" ? labels.sending : buttonLabel}
          </Button>
          {/* chuyển khoản: nhắc rõ bấm SAU khi chuyển xong (thay dòng "thông tin được bảo mật") */}
          <p
            className={cn(
              "mt-3 text-center text-xs",
              paymentMethod === PAY_BANK ? "text-sage-800 font-medium" : "text-ink-muted",
            )}
          >
            {paymentMethod === PAY_BANK ? msg.paidHint : labels.secure}
          </p>
        </div>
      </aside>
    </form>
  );
}
