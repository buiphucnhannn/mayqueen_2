"use client";

import { useEffect, useId, useState } from "react";
import { ArrowDown, Check, Copy, Download, Landmark, ScanLine } from "lucide-react";
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
    download: "Lưu ảnh mã QR",
    qrAlt: "Mã VietQR chuyển khoản cho đơn {code}",
    mobile: "Đặt bằng điện thoại? Lưu ảnh QR, rồi trong app ngân hàng chọn Quét QR → chọn ảnh.",
    after:
      "Sau khi nhận được tiền, chúng tôi sẽ xác nhận và gọi lại cho bạn để giao hàng. Đơn chuyển khoản được miễn phí vận chuyển.",
    inlineTitle: "Quét mã để thanh toán",
    inlineLead: "Mở app ngân hàng → Quét QR. Số tiền và nội dung đã điền sẵn.",
    inlineAfter: "Chuyển xong, bấm “Xác nhận đã thanh toán” bên dưới",
    copyShort: "Chép",
    copiedShort: "Đã chép",
    downloadShort: "Lưu ảnh QR",
    contentHintShort: "Giữ nguyên để được xác nhận nhanh",
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
    mobile: "On your phone? Save the QR, then in your banking app choose Scan QR → pick the image.",
    after:
      "Once we receive your payment we'll confirm and call you to arrange delivery. Bank-transfer orders ship free.",
    inlineTitle: "Scan to pay",
    inlineLead: "Open your banking app → Scan QR. Amount and note are filled in.",
    inlineAfter: "Once transferred, press “I've paid” below",
    copyShort: "Copy",
    copiedShort: "Copied",
    downloadShort: "Save QR",
    contentHintShort: "Keep as is for quick confirmation",
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
 * 1 dòng gọn (khung QR ở trang thanh toán): nhãn nhỏ + giá trị đậm + nút chép tròn nhỏ.
 * Bấm chép → nút xanh + dấu ✓ "Đã chép" 1,8 giây → khách biết chắc đã chép được.
 */
function CompactRow({ label, value, copyValue, hint, T }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <div className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <dt className="text-ink-muted text-[11px] leading-tight">{label}</dt>
        <dd className="text-forest mt-0.5 text-[15px] leading-snug font-semibold tracking-wide tabular-nums">
          {value}
        </dd>
        {hint && <p className="text-ink-muted mt-0.5 text-[11px] leading-snug">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={async () => setCopied(await copyText(String(copyValue)))}
        aria-label={`${T.copy}: ${label}`}
        title={T.copy}
        className={cn(
          "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
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
        <span aria-live="polite">{copied ? T.copiedShort : T.copyShort}</span>
      </button>
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
    const name = `VietQR-${payment.content}.png`;
    // Điện thoại: mở bảng chia sẻ của máy → "Lưu hình ảnh" vào thư viện Ảnh (iPhone không lưu được qua link tải),
    // rồi mở app ngân hàng → Quét QR → chọn ảnh. Máy tính / trình duyệt không hỗ trợ → tải file như thường.
    try {
      const file = new File([await (await fetch(url)).blob()], name, { type: "image/png" });
      const touch = window.matchMedia?.("(pointer: coarse)").matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return; // khách tự đóng bảng chia sẻ
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const qrBox = (
    <>
      {svg ? (
        <div
          role="img"
          aria-label={T.qrAlt.replace("{code}", payment.content)}
          className="aspect-square w-full [&>svg]:size-full"
          // SVG do thư viện qrcode tạo từ chuỗi VietQR (không chứa nội dung người dùng nhập)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="bg-sage-50 aspect-square w-full animate-pulse rounded-lg" />
      )}
    </>
  );

  // ---- Gọn (trang thanh toán, dưới "Tổng cộng"): QR trái + 3 thông tin chính phải, không làm cột dài lệch bố cục ----
  if (inline)
    return (
      <section
        className={cn(
          "border-sage-200 bg-sage-50/50 text-ink rounded-3xl border p-3.5 text-left sm:p-4",
          className,
        )}
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className="text-forest flex items-center gap-2 text-[15px] font-semibold">
          <ScanLine className="text-sage-600 size-[18px]" aria-hidden="true" />
          {T.inlineTitle}
        </h3>
        <p className="text-ink-soft mt-1 text-xs leading-relaxed">{T.inlineLead}</p>

        <div className="mt-3 grid items-center gap-3 sm:grid-cols-[8.75rem_1fr]">
          {/* QR + nút lưu ảnh */}
          <div className="mx-auto w-full max-w-40 sm:max-w-none">
            <div className="border-forest/10 rounded-2xl border bg-white p-2 shadow-sm">
              <p className="text-forest flex items-center justify-center gap-1 pb-1.5 text-[11px] font-semibold">
                <Landmark className="size-3" aria-hidden="true" />
                {payment.bankName}
              </p>
              {qrBox}
            </div>
            <button
              type="button"
              onClick={download}
              className="text-forest border-forest/20 hover:border-forest mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full border bg-white text-[11px] font-semibold transition-colors"
            >
              <Download className="size-3.5" aria-hidden="true" /> {T.downloadShort}
            </button>
          </div>

          {/* 3 thông tin khách cần (chuyển tay khi không quét được) — chủ tài khoản ghi nhỏ dưới số tài khoản */}
          <dl className="divide-forest/10 divide-y rounded-2xl bg-white px-3 py-2.5">
            <CompactRow
              T={T}
              label={`${T.accountNo} · ${payment.bankName}`}
              value={payment.accountNo}
              copyValue={payment.accountNo}
              hint={payment.accountName}
            />
            <CompactRow
              T={T}
              label={T.amount}
              value={formatPrice(payment.amount, lang)}
              copyValue={payment.amount}
            />
            <CompactRow
              T={T}
              label={T.content}
              value={payment.content}
              copyValue={payment.content}
              hint={T.contentHintShort}
            />
          </dl>
        </div>

        <p className="text-ink-muted mt-2.5 text-[11px] leading-relaxed sm:hidden">{T.mobile}</p>
        <p className="text-forest mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-center text-xs font-medium text-balance">
          <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
          {T.inlineAfter}
        </p>
      </section>
    );

  return (
    <section
      className={cn("bg-pearl shadow-card text-ink rounded-lg p-6 text-left sm:p-8", className)}
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
          // inline nằm ở cột "Đơn hàng của bạn" (hẹp) → xếp dọc: QR giữa, thông tin bên dưới
          inline ? "mt-4" : "mt-6 md:grid-cols-[minmax(0,15rem)_1fr]",
        )}
      >
        <div className={cn("mx-auto w-full", inline ? "max-w-56" : "max-w-60")}>
          <div className="border-forest/10 rounded-2xl border bg-white p-3 shadow-sm">
            <p className="text-forest flex items-center justify-center gap-1.5 pb-2 text-xs font-semibold">
              <Landmark className="size-3.5" aria-hidden="true" />
              {payment.bankName}
            </p>
            {qrBox}
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

        <dl className={cn("rounded-2xl px-3.5 sm:px-5", inline ? "bg-white" : "bg-cream/60")}>
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

      <p className="text-ink-muted mt-4 text-xs leading-relaxed md:hidden">{T.mobile}</p>
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
