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
          // Điện thoại: ẢNH chỉ chiếm phần TRÊN thẻ, phần dưới là nền xanh đậm cho chữ → sản phẩm và chữ tách bạch,
          // không đè nhau ở mọi bề ngang (ảnh phủ cả thẻ thì càng rộng ảnh càng phóng to, sản phẩm trôi xuống chữ).
          // sm+: ảnh phủ cả thẻ, cao bằng thẻ sản phẩm cùng hàng như cũ.
          className="reveal group text-pearl bg-forest-deep relative col-span-2 flex flex-col items-center justify-end overflow-hidden rounded-md px-5 pt-[13.5rem] pb-7 text-center sm:col-span-1 sm:min-h-full sm:bg-transparent sm:p-6"
          style={{ "--reveal-delay": `${shown.length * 90}ms` }}
        >
          <span className="absolute inset-x-0 top-0 h-60 sm:inset-0 sm:h-auto">
            <Image
              src={productImages.mayqueen.stone}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
              className="object-cover transition duration-[1.2s] group-hover:scale-[1.04]"
            />
            {/* điện thoại: mép dưới ảnh mờ dần vào nền xanh (không có đường cắt cứng) */}
            <span className="from-forest-deep absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t to-transparent sm:hidden" />
          </span>
          {/* điện thoại: ảnh mờ dần xuống nền xanh; sm+: nền tối đậm dần từ dưới lên phủ phần có chữ */}
          <span className="from-forest-deep via-forest-deep/85 to-forest-deep/0 absolute inset-0 bg-gradient-to-t via-40% sm:via-55%" />
          <span className="relative max-w-sm">
            <span className="text-leaf text-[10.5px] font-semibold tracking-[0.2em] uppercase">
              {promo.eyebrow}
            </span>
            <span className="mt-2 block font-serif text-2xl leading-tight text-balance">
              {promo.title}
            </span>
            <span className="text-pearl/80 mt-2 block text-[13px] leading-relaxed text-balance">
              {promo.text}
            </span>
            <span className="border-pearl mt-5 inline-block border-b pb-1 text-[11.5px] font-semibold tracking-[0.16em] uppercase">
              {promo.cta}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
