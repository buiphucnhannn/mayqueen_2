"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, Download, Landmark, ScanLine } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

const TEXT = {
  vi: {
    title: "Quét mã QR để thanh toán",
    awaiting: "Chờ thanh toán",
    lead: "Mở ứng dụng ngân hàng hoặc ví điện tử, chọn Quét QR. Số tiền và nội dung chuyển khoản được điền sẵn, bạn chỉ cần xác nhận.",
    bank: "Ngân hàng",
    accountNo: "Số tài khoản",
    accountName: "Chủ tài khoản",
    amount: "Số tiền",
    content: "Nội dung chuyển khoản",
    contentHint: "Giữ nguyên mã đơn để được xác nhận nhanh",
    copy: "Sao chép",
    copied: "Đã sao chép",
    download: "Tải ảnh mã QR",
    qrAlt: "Mã VietQR chuyển khoản cho đơn {code}",
    mobile:
      "Đang đặt bằng điện thoại? Bấm “Tải ảnh mã QR”, rồi trong app ngân hàng chọn Quét QR → chọn ảnh từ thư viện. Hoặc sao chép số tài khoản để chuyển thủ công.",
    after:
      "Sau khi nhận được tiền, chúng tôi sẽ xác nhận và gọi lại cho bạn để giao hàng. Đơn chuyển khoản được miễn phí vận chuyển.",
    inlineTitle: "Quét mã để thanh toán",
    inlineLead: "Mở app ngân hàng, chọn Quét QR — số tiền và nội dung đã điền sẵn.",
    inlineAfter: "Chuyển khoản xong, bấm “Xác nhận đã thanh toán” để hoàn tất đơn hàng.",
  },
  en: {
    title: "Scan to pay by bank transfer",
    awaiting: "Awaiting payment",
    lead: "Open your banking or e-wallet app and choose Scan QR. The amount and transfer note are filled in for you, just confirm.",
    bank: "Bank",
    accountNo: "Account number",
    accountName: "Account holder",
    amount: "Amount",
    content: "Transfer note",
    contentHint: "Keep the order ID as the note for quick confirmation",
    copy: "Copy",
    copied: "Copied",
    download: "Save QR image",
    qrAlt: "VietQR bank transfer code for order {code}",
    mobile:
      "Ordering on your phone? Tap “Save QR image”, then in your banking app choose Scan QR → pick the image from your gallery. Or copy the account number to transfer manually.",
    after:
      "Once we receive your payment we'll confirm and call you to arrange delivery. Bank-transfer orders ship free.",
    inlineTitle: "Scan to pay",
    inlineLead: "Open your banking app and choose Scan QR — amount and note are filled in.",
    inlineAfter: "Once transferred, press “I've paid” to complete your order.",
  },
};

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // trình duyệt cũ / không phải https → cách cũ
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

/** 1 dòng thông tin, có nút sao chép (giá trị sao chép có thể khác giá trị hiển thị, VD số tiền không dấu chấm) */
function InfoRow({ label, value, copyValue, strong, hint, T }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="border-forest/10 flex items-center justify-between gap-3 border-b py-3 last:border-0">
      <div className="min-w-0">
        <dt className="text-ink-muted text-xs">{label}</dt>
        <dd
          className={cn(
            "mt-0.5 break-words",
            strong ? "text-forest text-lg font-semibold tracking-wide" : "text-ink font-medium",
          )}
        >
          {value}
        </dd>
        {hint && <p className="text-sage-700 mt-1 text-xs leading-relaxed">{hint}</p>}
      </div>
      {copyValue !== undefined && (
        <button
          type="button"
          onClick={async () => setCopied(await copyText(String(copyValue)))}
          aria-label={`${T.copy}: ${label}`}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
            copied
              ? "border-sage-600 bg-sage-600 text-white"
              : "border-forest/15 text-forest hover:border-forest bg-white",
          )}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span aria-live="polite">{copied ? T.copied : T.copy}</span>
        </button>
      )}
    </div>
  );
}

/**
 * Thông tin chuyển khoản cho 1 đơn: mã VietQR (đã có sẵn số tiền + nội dung = mã đơn) + số tài khoản, số tiền,
 * nội dung có nút sao chép + tải ảnh QR (điện thoại không tự quét được màn hình của chính nó).
 * payment: { bankName, accountNo, accountName, amount, content, qr } — do backend trả (be/src/services/payment.service.js).
 */
/**
 * variant "card" (mặc định): khối riêng có tiêu đề lớn + nhãn trạng thái (màn đặt xong, tra cứu đơn).
 * variant "inline": nằm ngay trong khung "Hình thức thanh toán" ở trang thanh toán — tiêu đề nhỏ, không nhãn,
 *   dòng cuối nhắc bấm "Xác nhận đã thanh toán".
 * badge: chữ trên nhãn trạng thái (card) — mặc định "Chờ thanh toán".
 */
export default function BankTransferPanel({
  payment,
  lang = "vi",
  className,
  variant = "card",
  badge,
}) {
  const T = TEXT[lang] ?? TEXT.vi;
  const inline = variant === "inline";
  const titleId = useId();
  const [svg, setSvg] = useState("");

  // Thư viện vẽ QR chỉ tải khi cần (không làm nặng các trang khác)
  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((QR) =>
        QR.toString(payment.qr, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 1,
          color: { dark: "#1c2a21", light: "#ffffff" },
        }),
      )
      .then((s) => alive && setSvg(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [payment.qr]);

  const download = async () => {
    const QR = await import("qrcode");
    const url = await QR.toDataURL(payment.qr, {
      width: 720,
      margin: 3,
      errorCorrectionLevel: "M",
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `VietQR-${payment.content}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section
      className={cn(
        "text-ink text-left",
        inline
          ? "border-sage-200 bg-sage-50/50 rounded-3xl border p-4 sm:p-5"
          : "bg-pearl shadow-card rounded-lg p-6 sm:p-8",
        className,
      )}
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3
          id={titleId}
          className={cn(
            "text-forest flex items-center gap-2",
            inline ? "text-base font-semibold" : "font-serif text-2xl",
          )}
        >
          <ScanLine
            className={cn("text-sage-600", inline ? "size-5" : "size-6")}
            aria-hidden="true"
          />
          {inline ? T.inlineTitle : T.title}
        </h3>
        {!inline && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {badge ?? T.awaiting}
          </span>
        )}
      </div>
      <p className="text-ink-soft mt-1.5 text-sm leading-relaxed">
        {inline ? T.inlineLead : T.lead}
      </p>

      <div
        className={cn(
          "grid items-start gap-5",
          inline
            ? "mt-4 md:grid-cols-[minmax(0,13rem)_1fr]"
            : "mt-6 md:grid-cols-[minmax(0,15rem)_1fr]",
        )}
      >
        <div className="mx-auto w-full max-w-60">
          <div className="border-forest/10 rounded-2xl border bg-white p-3 shadow-sm">
            <p className="text-forest flex items-center justify-center gap-1.5 pb-2 text-xs font-semibold">
              <Landmark className="size-3.5" aria-hidden="true" />
              {payment.bankName}
            </p>
            {svg ? (
              <div
                role="img"
                aria-label={T.qrAlt.replace("{code}", payment.content)}
                className="aspect-square w-full [&>svg]:size-full"
                // SVG do thư viện qrcode tạo từ chuỗi VietQR của backend (không chứa nội dung người dùng nhập)
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="bg-sage-50 aspect-square w-full animate-pulse rounded-lg" />
            )}
            <p className="text-ink-muted pt-2 text-center text-[11px] tracking-wide">
              VietQR · NAPAS 247
            </p>
          </div>
          <button
            type="button"
            onClick={download}
            className="text-forest border-forest/20 hover:border-forest mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border bg-white text-sm font-semibold transition-colors"
          >
            <Download className="size-4" aria-hidden="true" /> {T.download}
          </button>
        </div>

        <dl className={cn("rounded-2xl px-4 sm:px-5", inline ? "bg-white" : "bg-cream/60")}>
          <InfoRow T={T} label={T.bank} value={payment.bankName} />
          <InfoRow
            T={T}
            label={T.accountNo}
            value={payment.accountNo}
            copyValue={payment.accountNo}
            strong
          />
          <InfoRow T={T} label={T.accountName} value={payment.accountName} />
          <InfoRow
            T={T}
            label={T.amount}
            value={formatPrice(payment.amount, lang)}
            copyValue={payment.amount}
            strong
          />
          <InfoRow
            T={T}
            label={T.content}
            value={payment.content}
            copyValue={payment.content}
            strong
            hint={T.contentHint}
          />
        </dl>
      </div>

      <p className="text-ink-muted mt-5 text-xs leading-relaxed md:hidden">{T.mobile}</p>
      <p
        className={cn(
          "mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed",
          inline ? "text-forest bg-white font-medium" : "bg-sage-50 text-sage-800",
        )}
      >
        {inline ? T.inlineAfter : T.after}
      </p>
    </section>
  );
}
