"use client";

import { useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import CircleLink from "@/components/ui/CircleLink";
import LuxTitle from "@/components/ui/LuxTitle";
import { useCart } from "@/context/CartContext";
import { href } from "@/i18n";
import { cheapestOption, cn, formatPrice } from "@/lib/utils";

/**
 * Sản phẩm trên trang chủ — thẻ ảnh lớn kiểu "Công nghệ" của Kobler: ảnh tràn thẻ, phóng nhẹ khi rê chuột,
 * chữ trắng IN HOA ở đáy. Mỗi thẻ: thời điểm dùng, tên, mô tả, giá + nút Mua ngay / thêm vào giỏ.
 */
function ShowcaseCard({ product, lang, labels, delay }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const option = cheapestOption(product);
  const link = href(lang, `/san-pham/${product.urlSlug}`);

  return (
    <article
      className="reveal group text-pearl relative flex min-h-[460px] flex-col justify-end overflow-hidden rounded-xl lg:min-h-[540px]"
      style={{ "--reveal-delay": delay }}
    >
      <Image
        src={product.images[0]}
        alt={product.name}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      {/* Bấm BẤT KỲ đâu trên thẻ → mở trang sản phẩm (con trỏ bàn tay trên toàn thẻ).
          Nút "+" và "Mua ngay" nằm lớp trên (z-10) nên vẫn bấm riêng được. */}
      <Link
        href={link}
        aria-label={product.name}
        tabIndex={-1}
        className="focus-visible:ring-pearl/70 absolute inset-0 z-[1] rounded-xl focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      />
      {product.ritual && (
        <span className="border-pearl/40 pointer-events-none absolute top-4 left-4 z-[2] rounded-full border bg-black/25 px-3 py-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase backdrop-blur-sm">
          {product.ritual}
        </span>
      )}

      {/* chữ nằm trên lớp liên kết nhưng không chặn chuột (pointer-events-none) → bấm vào chữ vẫn mở trang */}
      <div className="pointer-events-none relative z-[2] p-6 sm:p-7">
        <h3 className="text-[19px] font-bold tracking-[0.04em] uppercase">
          <Link
            href={link}
            className="pointer-events-auto hover:underline hover:underline-offset-4"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-pearl/80 mt-2 line-clamp-2 text-[14px] leading-relaxed">
          {product.short}
        </p>
        <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
          <span className="font-serif text-xl whitespace-nowrap sm:text-2xl">
            <span className="text-pearl/60 mr-1.5 font-sans text-[11px] tracking-[0.14em] uppercase">
              {labels.from}
            </span>{" "}
            {formatPrice(option.price, lang)}
          </span>
          <span className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                add(product.slug, option.id);
                setAdded(true);
                setTimeout(() => setAdded(false), 1600);
              }}
              aria-label={`${labels.addToCart}: ${product.name}`}
              className={cn(
                "grid size-10 place-items-center rounded-full border transition-colors",
                added
                  ? "border-sage-300 bg-sage-300 text-forest"
                  : "border-pearl/60 hover:bg-pearl hover:text-forest",
              )}
            >
              {added ? <Check className="size-4" /> : <Plus className="size-4" />}
            </button>
            <Link
              href={link}
              className="bg-pearl text-forest hover:bg-sage-100 inline-flex h-10 items-center rounded-full px-4 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors sm:px-5 sm:text-[11.5px]"
            >
              {labels.shopNow}
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ProductShowcase({ lang, data, products, labels }) {
  return (
    <section id="san-pham" className="bg-linen section-y scroll-mt-16">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <LuxTitle
          eyebrow={data.eyebrow}
          title={data.title}
          accent={data.accent}
          text={data.text}
          // mô tả ngắn 1 câu → màn rộng cho nằm gọn 1 dòng (điện thoại / tablet vẫn tự xuống dòng)
          textClassName="lg:max-w-none"
          aside={<CircleLink href={href(lang, "/san-pham")}>{data.all}</CircleLink>}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12">
          {products.map((p, i) => (
            <ShowcaseCard
              key={p.slug}
              product={p}
              lang={lang}
              labels={labels}
              delay={`${i * 120}ms`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
