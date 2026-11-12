import { cn } from "@/lib/utils";

// Chiếc lá trang trí (SVG) — dùng làm họa tiết nổi, kết hợp animate-float / Parallax.
export function LeafShape({ className, style }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("pointer-events-none", className)}
      style={style}
      aria-hidden="true"
    >
      <path d="M8 56C8 26 26 8 56 8c0 30-18 48-48 48z" fill="currentColor" />
      <path d="M10 54 50 14" stroke="rgb(255 255 255 / 0.45)" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

// Huy hiệu tròn chữ chạy quanh (xoay chậm)
export function RotatingBadge({ id = "badge-circle", text, className, children }) {
  return (
    <div className={cn("relative grid size-32 place-items-center", className)}>
      <svg viewBox="0 0 120 120" className="animate-spin-slow absolute inset-0" aria-hidden="true">
        <defs>
          <path id={id} d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text fill="currentColor" fontSize="10.5" fontWeight="600" letterSpacing="3.2">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      {children}
    </div>
  );
}

// Cành lá vẽ nét mảnh (line-art) — họa tiết trang trí tối giản, màu theo currentColor
export function LeafSprig({ className, style }) {
  return (
    <svg
      viewBox="0 0 120 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      className={cn("pointer-events-none", className)}
      style={style}
      aria-hidden="true"
    >
      <path d="M60 215C60 160 58 100 62 8" />
      <path d="M61 170c-18-6-34-22-38-44 20 4 34 20 38 44z" />
      <path d="M60 135c16-8 30-26 32-48-18 6-30 24-32 48z" />
      <path d="M61 100c-16-6-30-20-34-40 18 4 30 18 34 40z" />
      <path d="M61 66c13-7 24-21 26-38-15 5-24 19-26 38z" />
      <path d="M62 36c-10-4-18-14-20-27 12 3 19 12 20 27z" />
    </svg>
  );
}
