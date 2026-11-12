"use client";

import { useEffect, useRef } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { ShoppingBag, Sparkles, Trash2, Truck, X } from "lucide-react";
import QtyStepper from "@/components/cart/QtyStepper";
import Button from "@/components/ui/Button";
import Price from "@/components/ui/Price";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { href, localize } from "@/i18n";
import { lockScroll } from "@/lib/scroll";
import { cheapestOption, cn, formatPrice } from "@/lib/utils";

// Giỏ hàng trượt từ phải (Side Cart) — kiểu The Beauty Chef: thanh freeship, gợi ý combo, tổng tiền.
export default function CartDrawer({ labels }) {
  const { lang, products, lines, count, subtotal, saved, open, setOpen, setQty, remove, add } =
    useCart();
  const close = () => setOpen(false);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  // Mở giỏ: focus nút Đóng, Tab xoay vòng trong giỏ; đóng → trả focus về nút đã mở (icon giỏ / "Thêm vào giỏ")
  useFocusTrap(panelRef, open, { initialFocus: closeBtnRef });

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const left = Math.max(0, siteConfig.freeShipThreshold - subtotal);
  const progress = Math.min(100, (subtotal / siteConfig.freeShipThreshold) * 100);
  // Gợi ý combo: sản phẩm đầu tiên thuộc danh mục "combo" (đặt thứ tự trong Admin)
  const rawCombo = products.find((p) => p.category === "combo");
  const combo = rawCombo && localize(rawCombo, lang);
  const showUpsell = !!combo && lines.length > 0 && !lines.some((l) => l.slug === combo.slug);

  return (
    <div
      className={cn("fixed inset-0 z-[90]", open ? "pointer-events-auto" : "pointer-events-none")}
      inert={!open}
    >
      <div
        onClick={close}
        className={cn(
          "bg-forest-deep/40 absolute inset-0 transition-opacity duration-500",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          "bg-pearl absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="border-forest/10 flex items-center justify-between border-b px-6 py-5">
          <h2 id="cart-drawer-title" className="text-forest font-serif text-2xl">
            {labels.title} <span className="text-ink-muted text-base">({count})</span>
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="hover:bg-sage-100 grid size-10 place-items-center rounded-full"
          >
            <X className="size-5" />
          </button>
        </header>

        {lines.length > 0 && (
          <div className="border-forest/10 bg-sage-50 border-b px-6 py-4">
            <p className="text-sage-800 flex items-center gap-2 text-[13px]">
              <Truck className="size-4 shrink-0" aria-hidden="true" />
              {left > 0
                ? labels.freeShipLeft.replace("{amount}", formatPrice(left, lang))
                : labels.freeShipDone}
            </p>
            <div className="bg-sage-200 mt-2.5 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-sage-600 h-full rounded-full transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="bg-sage-100 text-sage-600 grid size-20 place-items-center rounded-full">
                <ShoppingBag className="size-8" aria-hidden="true" />
              </span>
              <p className="text-forest mt-5 font-serif text-2xl">{labels.empty}</p>
              <p className="text-ink-soft mt-2 text-sm">{labels.emptyText}</p>
              <Button href={href(lang, "/san-pham")} onClick={close} className="mt-6" arrow>
                {labels.continue}
              </Button>
            </div>
          ) : (
            <ul className="divide-forest/10 divide-y">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <Link
                    href={href(lang, `/san-pham/${l.urlSlug}`)}
                    onClick={close}
                    className="bg-sage-50 relative size-24 shrink-0 overflow-hidden rounded-2xl"
                  >
                    <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-forest leading-snug font-semibold">{l.name}</p>
                        <p className="text-ink-muted mt-0.5 text-xs">
                          {l.optionLabel}
                          {l.optionNote && <span className="block">{l.optionNote}</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.slug, l.optionId)}
                        aria-label={labels.remove}
                        className="text-ink-muted hover:bg-sage-100 hover:text-forest grid size-8 shrink-0 place-items-center rounded-full"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <QtyStepper
                        size="sm"
                        value={l.qty}
                        onChange={(q) => setQty(l.slug, l.optionId, q)}
                      />
                      <Price
                        price={l.price * l.qty}
                        compareAt={l.compareAt ? l.compareAt * l.qty : null}
                        lang={lang}
                        className="flex-col items-end gap-0 text-right"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showUpsell && (
            <div className="border-sage-200 bg-sage-50 mt-4 rounded-3xl border p-4">
              <p className="text-sage-700 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="size-3.5" aria-hidden="true" /> {labels.upsell}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={combo.images[0]}
                    alt={combo.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-forest text-sm leading-snug font-semibold">{combo.name}</p>
                  <Price
                    price={cheapestOption(combo).price}
                    compareAt={cheapestOption(combo).compareAt}
                    lang={lang}
                    className="text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    add(combo.slug, cheapestOption(combo).id, 1, { openDrawer: false })
                  }
                  className="bg-forest text-pearl hover:bg-sage-700 grid size-10 shrink-0 place-items-center rounded-full text-lg transition"
                  aria-label={combo.name}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="border-forest/10 border-t px-6 pt-5 pb-6">
            {saved > 0 && (
              // đã trừ sẵn trong giá từng món (Tạm tính là giá sau giảm) → không ghi "−", kèm ghi chú
              <div className="text-sage-700 flex items-baseline justify-between gap-3 text-sm">
                <span>
                  {labels.saved}{" "}
                  <span className="text-ink-muted text-xs">({labels.savedNote})</span>
                </span>
                <span className="font-semibold whitespace-nowrap">{formatPrice(saved, lang)}</span>
              </div>
            )}
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-semibold">{labels.subtotal}</span>
              <span className="text-forest font-serif text-2xl">{formatPrice(subtotal, lang)}</span>
            </div>
            <Button
              href={href(lang, "/thanh-toan")}
              onClick={() => {
                close();
                // sang trang thanh toán: bỏ focus khỏi giỏ (nằm cuối trang) → phím Tab bắt đầu lại từ đầu trang
                // mới, không phải đi qua hết chân trang mới tới ô "Họ tên"
                setTimeout(() => document.activeElement?.blur(), 60);
              }}
              size="lg"
              className="mt-4 w-full"
              arrow
            >
              {labels.checkout}
            </Button>
            <p className="text-ink-muted mt-3 text-center text-xs">{labels.note}</p>
          </footer>
        )}
      </aside>
    </div>
  );
}
