import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nút theo phong cách The Beauty Chef: chữ in hoa giãn cách, bo tròn dạng viên thuốc.
 * - variant "link": chữ in hoa gạch chân (kiểu "CHOOSE YOUR GLOW").
 * - Có `href` → link; không có → <button>. arrow: thêm mũi tên trượt nhẹ khi hover.
 * - Truyền data-consult để nút mở popup tư vấn.
 */
const variants = {
  primary: "bg-forest text-pearl hover:bg-sage-700",
  soft: "bg-sage-100 text-forest hover:bg-sage-200",
  outline:
    "border border-forest/25 text-forest hover:border-forest hover:bg-forest hover:text-pearl",
  light: "bg-pearl text-forest hover:bg-sage-50",
  leaf: "bg-leaf text-forest hover:bg-sage-300",
  link: "h-auto! px-0! pb-1 border-b border-current rounded-none text-current hover:text-sage-600",
};

const sizes = {
  sm: "h-10 px-5 text-[11px]",
  md: "h-12 px-7 text-xs",
  lg: "h-[52px] px-9 text-[13px]",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  external = false,
  className,
  children,
  ...props
}) {
  const classes = cn(
    "group/btn inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full font-semibold tracking-[0.16em] whitespace-nowrap uppercase transition-colors duration-300",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:pointer-events-none disabled:opacity-60",
    sizes[size],
    variants[variant],
    className,
  );

  const content = (
    <>
      {children}
      {arrow && (
        <ArrowRight
          className="size-3.5 transition-transform duration-300 group-hover/btn:translate-x-1"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href) {
    if (external || /^(tel|mailto):/.test(href))
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={classes}
          {...props}
        >
          {content}
        </a>
      );
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}
