"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, Wallet } from "lucide-react";
import QtyStepper from "@/components/cart/QtyStepper";
import Button from "@/components/ui/Button";
import Price from "@/components/ui/Price";
import { useCart } from "@/context/CartContext";
import { href } from "@/i18n";
import { cn, discountPercent, formatPrice } from "@/lib/utils";

/**
 * Khối mua hàng trang chi tiết: chọn gói / combo (thẻ radio), số lượng, Thêm vào giỏ, Mua ngay.
 * Mua ngay = thêm vào giỏ rồi chuyển thẳng tới trang thanh toán.
 */
export default function ProductPurchase({ product, lang, labels }) {
  const router = useRouter();
  const { add } = useCart();
  const [optionId, setOptionId] = useState(
    (product.options.find((o) => o.popular) ?? product.options[0]).id,
  );
  const [qty, setQty] = useState(1);
  const option = product.options.find((o) => o.id === optionId);

  const buyNow = () => {
    add(product.slug, optionId, qty, { openDrawer: false });
    router.push(href(lang, "/thanh-toan"));
  };

  return (
    <div>
      <fieldset>
        <legend className="text-forest mb-3 text-sm font-semibold">{labels.chooseOption}</legend>
        <div className="space-y-3">
          {product.options.map((o) => {
            const off = discountPercent(o.price, o.compareAt);
            const checked = o.id === optionId;
            return (
              <label
                key={o.id}
                className={cn(
                  "relative flex cursor-pointer items-center gap-4 rounded-md border-2 bg-white px-5 py-4 transition",
                  checked ? "border-sage-600 bg-sage-50" : "border-forest/10 hover:border-sage-300",
                )}
              >
                <input
                  type="radio"
                  name="option"
                  value={o.id}
                  checked={checked}
                  onChange={() => setOptionId(o.id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border-2 transition",
                    checked ? "border-sage-600" : "border-forest/25",
                  )}
                >
                  <span
                    className={cn(
                      "bg-sage-600 size-2.5 rounded-full transition",
                      checked ? "scale-100" : "scale-0",
                    )}
                  />
                </span>
                <span className="flex-1">
                  <span className="text-forest block font-semibold">{o.label}</span>
                  <span className="text-ink-muted block text-xs">{o.note}</span>
                </span>
                <Price
                  price={o.price}
                  compareAt={o.compareAt}
                  lang={lang}
                  className="flex-col items-end gap-0 text-right"
                />
                {o.popular && (
                  <span className="bg-leaf text-forest absolute -top-2.5 right-5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                    {labels.popular}
                  </span>
                )}
                {off > 0 && !o.popular && (
                  <span className="bg-forest text-pearl absolute -top-2.5 right-5 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    -{off}%
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* điện thoại: ô số lượng căn giữa, nút "Thêm vào giỏ" rộng hết hàng bên dưới; màn rộng: cùng 1 hàng */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <QtyStepper value={qty} onChange={setQty} />
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto sm:flex-1"
          onClick={() => add(product.slug, optionId, qty)}
        >
          {labels.addToCart}
        </Button>
      </div>
      <Button size="lg" arrow className="mt-3 w-full" onClick={buyNow}>
        {labels.buyNow} - {formatPrice(option.price * qty, lang)}
      </Button>

      <ul className="bg-sage-50 text-ink-soft mt-6 grid gap-3 rounded-md p-5 text-[13px] sm:grid-cols-3">
        {[
          [Truck, labels.perks[0]],
          [Wallet, labels.perks[1]],
          [ShieldCheck, labels.perks[2]],
        ].map(([Icon, text]) => (
          <li key={text} className="flex items-center gap-2.5">
            <Icon className="text-sage-600 size-5 shrink-0" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
