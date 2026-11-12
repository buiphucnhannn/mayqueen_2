"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "@/components/ui/Img";
import { Check, Phone, X } from "lucide-react";
import ConsultForm from "@/components/forms/ConsultForm";
import { MessengerIcon, ZaloIcon } from "@/components/ui/BrandIcons";
import { brand, productImages } from "@/data/images";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { usePresence } from "@/hooks/usePresence";
import { lockScroll } from "@/lib/scroll";

/**
 * Popup đăng ký tư vấn dùng chung toàn site (thay cho section tư vấn).
 * Mở bằng BẤT KỲ phần tử nào có thuộc tính data-consult — không cần truyền state qua props.
 * Desktop: hộp 2 cột (ảnh + lời mời | form) theo bản thiết kế lớn 1080px, TỰ CO ĐỀU (CSS zoom) cho vừa
 * màn hình (laptop thấp / Windows phóng to 125–150%) → luôn to nhất có thể, cân đối, không phải cuộn.
 * Mobile / tablet: cuộn trong popup, thu gọn khoảng cách theo chiều cao (short / tiny / micro).
 */
const DESKTOP = 1024;
const GAP = 24; // chừa mép quanh popup (px) — popup cao gần trọn màn hình
export default function ConsultModal({ labels, formLabels, site }) {
  const [open, setOpen] = useState(false);
  // key tăng mỗi lần mở → form làm mới (xóa trạng thái "đã gửi" của lần trước)
  const [session, setSession] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const { mounted, closing } = usePresence(open, 380);
  const cardRef = useRef(null);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const openerRef = useRef(null); // nút đã mở popup → đóng thì trả focus về đây
  // Mở: focus nút Đóng (không bật bàn phím ảo trên điện thoại); Tab xoay vòng trong popup
  useFocusTrap(dialogRef, open, { initialFocus: closeBtnRef, returnFocus: openerRef });

  // Máy tính: đo kích thước thật của popup (zoom = 1) rồi co đều cho vừa khung nhìn; mở lại / đổi cỡ cửa sổ → tính lại
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!mounted || !el) return;
    const fit = () => {
      el.style.zoom = "";
      if (window.innerWidth < DESKTOP) return;
      const z = Math.min(
        1,
        (window.innerWidth - GAP) / el.offsetWidth,
        (window.innerHeight - GAP) / el.offsetHeight,
      );
      if (z < 1) el.style.zoom = z.toFixed(3);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [mounted, session]);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest("[data-consult]")) return;
      e.preventDefault();
      // Chrome focus sẵn nút vừa bấm; Safari không → lấy chính phần tử data-consult
      const active = document.activeElement;
      openerRef.current =
        active && active !== document.body ? active : e.target.closest("[data-consult]");
      setSession((n) => n + 1);
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open, close]);

  if (!mounted) return null;

  const quick = [
    { href: site.messenger, label: "Messenger", Icon: MessengerIcon, ext: true },
    { href: site.zalo, label: "Zalo", Icon: ZaloIcon, ext: true },
    { href: `tel:${site.phoneRaw}`, label: site.phone, Icon: Phone },
  ];

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={`fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 ${closing ? "pointer-events-none" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      <div
        className={`bg-forest-deep/60 absolute inset-0 backdrop-blur-[2px] ${closing ? "[animation:fadeOut_.38s_ease-in_both]" : "[animation:fadeIn_.4s_ease-out_both]"}`}
        onClick={close}
      />

      <div
        ref={cardRef}
        className={`bg-pearl shadow-soft relative grid max-h-[calc(100svh-24px)] w-full max-w-[920px] grid-rows-[minmax(0,1fr)] overflow-hidden rounded-[20px] lg:max-h-none lg:w-[1080px] lg:max-w-none lg:grid-cols-[0.42fr_0.58fr] ${closing ? "[animation:sheetOut_.36s_cubic-bezier(.4,0,1,1)_both]" : "[animation:sheetIn_.6s_cubic-bezier(.22,1,.36,1)_both]"}`}
      >
        {/* Cột ảnh (desktop) */}
        <div className="relative hidden lg:block">
          <Image
            src={productImages.mayqueen.stone}
            alt=""
            fill
            quality={92}
            sizes="(min-width: 1024px) 800px, 1px"
            className="object-cover object-[46%_center]"
          />
          <div className="from-forest-deep/90 via-forest-deep/25 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="text-pearl absolute inset-x-0 bottom-0 px-10 pt-10 pb-12">
            <p className="font-serif text-[34px] leading-[1.15] whitespace-pre-line">
              {labels.headline}
            </p>
            <ul className="mt-5 space-y-2.5">
              {labels.bullets.map((b) => (
                <li key={b} className="text-pearl/90 flex items-start gap-2.5 text-[15.5px] leading-snug">
                  <Check className="text-leaf mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cột form — data-lenis-prevent: cuộn bên trong popup không bị Lenis chặn.
            min-h-0 + hàng lưới minmax(0,1fr): màn hình thấp thì cột co theo popup và CUỘN được
            (thiếu 2 cái này, nội dung tràn xuống dưới mép popup và bị cắt mất phần liên hệ nhanh) */}
        <div
          data-lenis-prevent
          className="no-scrollbar max-lg:short:sm:pt-6 max-lg:short:sm:pb-7 max-lg:micro:sm:pt-5 max-lg:micro:sm:pb-5 relative min-h-0 overflow-y-auto overscroll-contain px-5 pt-6 pb-7 sm:px-9 sm:pt-8 sm:pb-10 lg:px-14 lg:pt-9 lg:pb-9"
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="text-forest/70 hover:bg-sage-50 hover:text-forest absolute top-3 right-3 grid size-10 place-items-center rounded-full transition sm:top-4 sm:right-4"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center text-center">
            <Image
              src={brand.horizontal}
              alt="B.O.T"
              width={357}
              height={136}
              className="max-lg:tiny:h-6 max-lg:micro:hidden h-7 w-auto lg:h-8"
            />
            <h3 className="text-forest max-lg:short:sm:mt-3 max-lg:tiny:sm:mt-2 max-lg:tiny:sm:text-[28px] max-lg:micro:mt-0! mt-3 font-serif text-[24px] leading-tight sm:mt-4 sm:text-[32px] lg:mt-5 lg:text-[40px]">
              {labels.title}
            </h3>
            <p className="text-ink-soft max-lg:tiny:mt-1.5 max-lg:tiny:leading-snug mt-2 max-w-sm text-[13.5px] leading-relaxed text-balance lg:mt-3 lg:max-w-lg lg:text-[16px]">
              {labels.desc}
            </p>
          </div>

          <div className="max-lg:short:sm:mt-5 max-lg:tiny:sm:mt-4 mt-5 sm:mt-6 lg:mt-7">
            <ConsultForm key={session} labels={formLabels} />
          </div>

          <div className="border-forest/10 text-ink-muted max-lg:short:sm:mt-5 max-lg:short:sm:pt-4 max-lg:tiny:sm:mt-4 max-lg:tiny:sm:pt-3.5 mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t pt-4 text-[12px] sm:mt-6 sm:gap-x-5 sm:pt-5 lg:mt-7 lg:gap-x-6 lg:pt-5 lg:text-[15px]">
            <span>{labels.or}</span>
            {quick.map(({ href, label, Icon, ext }) => (
              <a
                key={label}
                href={href}
                target={ext ? "_blank" : undefined}
                rel={ext ? "noopener noreferrer" : undefined}
                className="text-forest/80 hover:text-forest inline-flex items-center gap-1.5 font-medium transition"
              >
                <Icon className="size-4 lg:size-[18px]" /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
