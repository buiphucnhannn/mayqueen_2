"use client";

import { useState } from "react";
import Image from "@/components/ui/Img";
import ProductCard from "@/components/product/ProductCard";
import { productImages } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * Lưới sản phẩm có tab danh mục (kiểu "Shop Our Bestsellers" của The Beauty Chef)
 * + ô mời tư vấn 1:1 (thay cho "Take the quiz") — bấm mở popup tư vấn.
 */
export default function Bestsellers({ products, categories, labels, promo, lang }) {
  const [tab, setTab] = useState("all");
  const shown = tab === "all" ? products : products.filter((p) => p.category === tab);

  return (
    <div>
      <div
        role="tablist"
        className="no-scrollbar border-forest/10 -mx-4 flex justify-start gap-5 overflow-x-auto border-b px-4 sm:justify-center sm:gap-10"
      >
        {categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              // pt-3 + -mt-3: vùng chạm ≥ 44px trên điện thoại mà bố cục không đổi
              "-mt-3 -mb-px shrink-0 border-b-2 pt-3 pb-3 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors sm:text-[12px] sm:tracking-[0.16em]",
              tab === c.id
                ? "border-forest text-forest"
                : "text-ink-muted hover:text-forest border-transparent",
            )}
            title={c.label}
          >
            {/* tên danh mục dài → cắt "…" (rê chuột xem đủ) */}
            <span className="block max-w-[14rem] truncate">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Tiêu đề ẩn (chỉ trình đọc màn hình): thứ bậc h1 (banner) → h2 → h3 (tên từng thẻ sản phẩm) */}
      {labels.productList && <h2 className="sr-only">{labels.productList}</h2>}
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-10 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-4">
        {shown.map((p, i) => (
          <div
            key={`${tab}-${p.slug}`}
            className="reveal"
            style={{ "--reveal-delay": `${i * 90}ms` }}
          >
            <ProductCard product={p} lang={lang} labels={labels} />
          </div>
        ))}

        <button
          key={`${tab}-promo`}
          type="button"
          data-consult=""
          className="reveal group text-pearl relative col-span-2 flex aspect-[16/10] flex-col items-center justify-end overflow-hidden rounded-md p-6 text-center sm:col-span-1 sm:aspect-auto sm:min-h-full"
          style={{ "--reveal-delay": `${shown.length * 90}ms` }}
        >
          <Image
            src={productImages.mayqueen.stone}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, 45vw"
            className="object-cover transition duration-[1.2s] group-hover:scale-[1.04]"
          />
          <span className="from-forest-deep/95 via-forest-deep/70 absolute inset-0 bg-gradient-to-t to-transparent" />
          <span className="relative">
            <span className="text-leaf text-[10.5px] font-semibold tracking-[0.2em] uppercase">
              {promo.eyebrow}
            </span>
            <span className="mt-2 block font-serif text-2xl leading-tight">{promo.title}</span>
            <span className="text-pearl/75 mt-2 block text-[13px]">{promo.text}</span>
            <span className="border-pearl mt-5 inline-block border-b pb-1 text-[11.5px] font-semibold tracking-[0.16em] uppercase">
              {promo.cta}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
