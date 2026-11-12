"use client";

import { href } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Ô tick "Tôi đồng ý … Chính sách bảo mật" cho form thu thập thông tin khách hàng.
 *
 * Theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực 01/01/2026), sự đồng ý của khách phải:
 * - tự nguyện, CHỦ ĐỘNG: ô KHÔNG tick sẵn, khách tự tick (im lặng / không phản hồi không được coi là đồng ý)
 * - rõ ràng, cụ thể: nêu đúng mục đích dùng dữ liệu của từng form + link tới chính sách đầy đủ
 * - CHỨNG MINH được: form gửi kèm { privacy: true, version } → backend lưu phiên bản chính sách + thời điểm
 *   (be/src/validators/common.validator.js)
 *
 * Link mở tab mới → khách đọc chính sách không bị mất dữ liệu đang điền. Link là <a href> thường (Google đi theo
 * được, không nofollow) → củng cố liên kết nội bộ tới trang chính sách.
 */

/** Đổi nội dung Chính sách bảo mật (data/policies.js) → đổi ngày này để biết khách đã đồng ý theo bản nào */
export const PRIVACY_VERSION = "2026-11-09";

const policyHref = (lang, vi, en) => href(lang, `/chinh-sach/${lang === "en" ? en : vi}`);

const COPY = {
  vi: {
    agree: "Tôi đã đọc và đồng ý với",
    privacy: "Chính sách bảo mật",
    and: "và",
    returns: "Chính sách đổi trả",
    purpose: {
      order: ", cho phép Công ty BOT Việt Nam xử lý thông tin cá nhân để giao hàng và hỗ trợ đơn hàng.",
      consult: ", cho phép Công ty BOT Việt Nam dùng họ tên, số điện thoại để liên hệ tư vấn.",
    },
    error: "Vui lòng tick đồng ý để tiếp tục.",
    newTab: "(mở tab mới)",
  },
  en: {
    agree: "I have read and agree to the",
    privacy: "Privacy policy",
    and: "and",
    returns: "Returns policy",
    purpose: {
      order: ", and allow BOT Vietnam to process my personal data to deliver and support my order.",
      consult: ", and allow BOT Vietnam to use my name and phone number to contact me with advice.",
    },
    error: "Please tick the box to continue.",
    newTab: "(opens in a new tab)",
  },
};

export const consentPayload = () => ({ privacy: true, version: PRIVACY_VERSION });

/**
 * @param purpose  "order" (đặt hàng: kèm Chính sách đổi trả) | "consult" (đăng ký tư vấn)
 * @param error    true → hiện lỗi dưới ô tick
 */
/**
 * compact: chưa tick → tô đỏ ô + chữ thay vì thêm dòng báo lỗi (popup tư vấn có chiều cao cố định)
 */
export default function ConsentCheckbox({
  id,
  lang,
  purpose,
  checked,
  onChange,
  error,
  compact,
  className,
}) {
  const c = COPY[lang] ?? COPY.vi;
  const link = (to, text) => (
    <a
      href={to}
      target="_blank"
      rel="noopener"
      // nowrap: tên chính sách không bị ngắt giữa chừng ("Chính sách đổi / trả") — cả cụm xuống dòng cùng nhau
      className="text-sage-700 hover:text-forest focus-visible:text-forest font-semibold whitespace-nowrap transition-colors"
    >
      {text}
      <span className="sr-only"> {c.newTab}</span>
    </a>
  );
  return (
    <div className={className}>
      {/* cỡ chữ theo các ô nhập của form (14px → 15px trên máy tính) để dễ đọc, không lép vế so với form */}
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          aria-required="true"
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "accent-sage-600 mt-[3px] size-5 shrink-0 cursor-pointer rounded lg:mt-1",
            error && "outline-2 outline-offset-2 outline-red-400",
          )}
        />
        {/* label bọc chữ (không bọc link): bấm vào chữ = tick, bấm vào link = mở chính sách */}
        <p
          className={cn(
            // text-pretty: tránh dòng cuối chỉ còn 1 chữ lẻ loi
            "text-sm leading-relaxed text-pretty transition-colors lg:text-[15.5px]",
            // popup tư vấn trên điện thoại: chữ nhỏ + dòng sát hơn → popup vừa 1 màn hình
            compact && "max-sm:text-[13px] max-sm:leading-snug",
            error && compact ? "text-red-600" : "text-ink-soft",
          )}
        >
          <label htmlFor={id} className="cursor-pointer">
            {c.agree}{" "}
          </label>
          {link(policyHref(lang, "bao-mat", "privacy"), c.privacy)}
          {purpose === "order" && (
            <>
              {" "}
              <label htmlFor={id} className="cursor-pointer">
                {c.and}
              </label>{" "}
              {link(policyHref(lang, "doi-tra", "returns"), c.returns)}
            </>
          )}
          <label htmlFor={id} className="cursor-pointer">
            {c.purpose[purpose]}
          </label>
          {/* khoảng trắng không ngắt dòng: dấu * luôn đi liền chữ cuối, không rơi xuống dòng một mình */}
          <span className="text-sage-600" aria-hidden="true">
            {" *"}
          </span>
        </p>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className={compact ? "sr-only" : "mt-1.5 pl-8 text-[13px] text-red-600"}
          role="alert"
        >
          {c.error}
        </p>
      )}
    </div>
  );
}
