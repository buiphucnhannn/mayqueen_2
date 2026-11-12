"use client";

import { useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import Price from "@/components/ui/Price";
import { useCart } from "@/context/CartContext";
import { href } from "@/i18n";
import { cheapestOption, cn } from "@/lib/utils";

/**
 * Thẻ sản phẩm kiểu The Beauty Chef: ảnh vuông (ảnh thứ 2 hiện khi hover), nhãn nhỏ,
 * chữ căn giữa, nút "Thêm vào giỏ" toàn chiều ngang. product: dữ liệu ĐÃ localize.
 * Bấm VÀO BẤT KỲ ĐÂU trên thẻ → trang chi tiết (link tên phủ toàn thẻ); nút giỏ hàng nằm trên lớp phủ.
 */
// mặc định: lưới 2 cột trên điện thoại (Cửa hàng / Bán chạy) → ảnh ~46% chiều ngang màn hình
const SIZES = "(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 46vw";

export default function ProductCard({
  product,
  lang,
  labels,
  className,
  priority = false,
  sizes = SIZES,
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  // ảnh thứ 2 chỉ dùng khi rê chuột (máy tính) → chỉ tải khi chuột lần đầu chạm thẻ; điện thoại không tải thừa
  const [hovered, setHovered] = useState(false);
  const option = cheapestOption(product);
  const link = href(lang, `/san-pham/${product.urlSlug}`);

  const quickAdd = () => {
    add(product.slug, option.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      className={cn("group relative flex cursor-pointer flex-col text-center", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
    >
      <Link
        href={link}
        tabIndex={-1}
        aria-hidden="true"
        className="bg-sand relative block aspect-square overflow-hidden rounded-md"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        {hovered && product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        {product.badge && (
          <span className="bg-forest text-pearl absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col items-center px-1 sm:mt-4 sm:px-2">
        {/* nhãn nhỏ: điện thoại (thẻ hẹp) chừa sẵn 2 dòng, tablet trở lên 1 dòng → không cắt chữ, các thẻ vẫn đều hàng */}
        <p className="text-sage-600 line-clamp-2 min-h-[2lh] w-full text-[10px] leading-snug font-semibold tracking-[0.14em] uppercase sm:line-clamp-1 sm:min-h-[1lh] sm:text-[10.5px] sm:tracking-[0.2em]">
          {product.ritual}
        </p>
        {/* Tên & mô tả luôn chiếm đúng 2 dòng (dài thì cắt "…", ngắn thì chừa chỗ) + giá đẩy xuống đáy
            → giá và nút "Thêm vào giỏ" của mọi thẻ trong hàng luôn thẳng hàng nhau. */}
        <h3 className="text-forest mt-1.5 line-clamp-2 min-h-[2lh] font-serif text-[17px] leading-tight sm:text-xl">
          <Link
            href={link}
            className="group-hover:text-sage-600 transition-colors after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-ink-soft mt-1 line-clamp-2 min-h-[2lh] text-[12px] leading-snug sm:text-[13px]">
          {product.tagline}
        </p>
        <Price
          price={option.price}
          compareAt={option.compareAt}
          lang={lang}
          className="mt-auto justify-center pt-2 text-[15px]"
        />
      </div>

      <button
        type="button"
        onClick={quickAdd}
        className={cn(
          "relative z-10 mt-3 h-10 w-full rounded-full border text-[10.5px] font-semibold tracking-[0.1em] uppercase transition-colors duration-300 sm:mt-4 sm:h-11 sm:text-[11.5px] sm:tracking-[0.16em]",
          added
            ? "border-sage-600 bg-sage-600 text-pearl"
            : "border-forest text-forest hover:bg-forest hover:text-pearl",
        )}
      >
        {added ? labels.added : labels.addToCart}
      </button>
    </article>
  );
}
