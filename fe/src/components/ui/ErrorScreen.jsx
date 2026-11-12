import Image from "@/components/ui/Img";
import Link from "next/link";
import { backgrounds, brand } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * Màn hình lỗi / trạng thái dùng chung (403 - 404 - 429 - 500) theo nhận diện Mayqueen:
 * nền xanh rêu sâu + ảnh lá mờ, mã lỗi serif cỡ lớn viền mảnh, tiêu đề IN HOA, mô tả ngắn và nút hành động.
 *   <ErrorScreen code="404" eyebrow="..." title="..." text="..." actions={[{ href, label, primary }]} />
 * text: chuỗi, hoặc mảng các câu → mỗi câu nằm trọn 1 dòng.
 * children: chèn thêm nội dung tùy biến (vd. nút đếm ngược ở trang 429).
 * embedded: dùng BÊN TRONG layout site (đã có header/footer) → bỏ logo + chân riêng, không chiếm full màn hình.
 * homeHref / footer: link logo + dòng chân trang theo ngôn ngữ (bản tiếng Anh: "/en", "B.O.T Vietnam").
 */
export default function ErrorScreen({
  code,
  eyebrow,
  title,
  text,
  actions = [],
  embedded = false,
  homeHref = "/",
  footer = "Mayqueen Slim - B.O.T Việt Nam",
  languages, // [{ code: "vi" | "en", href, title, current }] — nút đổi ngôn ngữ ở góc trên (trang toàn màn hình)
  languagesLabel = "Ngôn ngữ",
  children,
}) {
  const Tag = embedded ? "section" : "main";
  // Trang lỗi toàn màn hình (404 / 403 / 429) do proxy trả về NGAY TẠI URL lỗi (vd. /en/abc) → bộ định tuyến
  // phía trình duyệt của Next lệch với URL nên <Link> không chuyển trang được → dùng thẻ <a> thường (tải trang mới).
  const A = embedded ? Link : "a";
  return (
    <Tag
      className={cn(
        "bg-moss text-pearl relative isolate flex flex-col overflow-hidden",
        embedded ? "min-h-[min(100svh,900px)] pt-16 lg:pt-24" : "min-h-svh",
      )}
    >
      {/* nền: ảnh lá xanh tối, mờ sâu */}
      <div className="absolute inset-0 -z-10">
        {/* ảnh nền mờ: không priority — để font/CSS được ưu tiên, ảnh hiện dần phía sau (opacity thấp, không gây giật) */}
        <Image
          src={backgrounds.moodyLeaves}
          alt=""
          fill
          sizes="100vw"
          quality={30}
          className="scale-110 object-cover opacity-35 blur-sm"
        />
        <div className="from-moss via-moss/85 to-moss/60 absolute inset-0 bg-gradient-to-t" />
        <div className="text-sage-600/40 glow absolute top-1/2 left-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2" />
      </div>

      {!embedded && (
        <header className="flex items-center justify-between px-5 py-6 sm:px-10">
          <A href={homeHref} aria-label="Mayqueen Slim" className="inline-flex">
            <Image
              src={brand.horizontalWhite}
              alt="B.O.T"
              width={357}
              height={136}
              className="h-9 w-auto"
            />
          </A>
          {/* VI / EN — cùng kiểu nút đổi ngôn ngữ trên header site; trỏ tới trang có thật (trang chủ ngôn ngữ kia) */}
          {languages && (
            <nav
              aria-label={languagesLabel}
              className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em]"
            >
              {languages.map((l, i) => (
                <span key={l.code} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-pearl/40">/</span>}
                  {l.current ? (
                    <span
                      aria-current="true"
                      className="text-pearl uppercase underline underline-offset-4"
                    >
                      {l.code}
                    </span>
                  ) : (
                    <a
                      href={l.href}
                      hrefLang={l.code}
                      lang={l.code}
                      title={l.title}
                      className="text-pearl/70 hover:text-pearl uppercase transition"
                    >
                      {l.code}
                    </a>
                  )}
                </span>
              ))}
            </nav>
          )}
        </header>
      )}

      <div className="flex flex-1 items-center justify-center px-5 pb-20 text-center">
        {/* không chạy fadeUp: trang trạng thái do server trả thẳng (403/429), nội dung đã sẵn sàng
            ngay lần vẽ đầu — animation 0.9s chạy đè lúc font đang swap tạo cảm giác "giật 2 lần" */}
        <div className="max-w-xl">
          <p
            aria-hidden="true"
            className="font-serif text-[120px] leading-none font-medium tracking-[0.02em] text-transparent [-webkit-text-stroke:1px_rgb(179_202_147/0.7)] sm:text-[180px]"
          >
            {code}
          </p>
          {eyebrow && (
            <p className="text-sage-300 mt-6 text-[11px] font-semibold tracking-[0.3em] uppercase">
              {eyebrow}
            </p>
          )}
          {/* text-balance: tiêu đề dài trên điện thoại tự cân 2 dòng (không tách "tạm / thời") */}
          <h1 className="h-lux text-pearl mt-3 text-[28px] text-balance sm:text-[38px]">{title}</h1>
          {text && (
            <p className="text-pearl/75 mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-balance">
              {/* mảng = mỗi câu 1 dòng (không ngắt giữa câu); chuỗi = tự cân dòng */}
              {Array.isArray(text)
                ? text.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))
                : text}
            </p>
          )}

          {(actions.length > 0 || children) && (
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {children}
              {actions.map((a) => (
                <A
                  key={a.href + a.label}
                  href={a.href}
                  className={cn(
                    "inline-flex h-12 items-center justify-center rounded-full px-7 text-xs font-semibold tracking-[0.16em] uppercase transition-colors duration-300",
                    a.primary
                      ? "bg-pearl text-forest hover:bg-sage-100"
                      : "border-pearl/35 text-pearl hover:border-pearl hover:bg-pearl/10 border",
                  )}
                >
                  {a.label}
                </A>
              ))}
            </div>
          )}
        </div>
      </div>

      {!embedded && (
        <footer className="text-pearl/40 px-5 pb-6 text-center text-[11px] tracking-[0.2em] uppercase">
          {footer}
        </footer>
      )}
    </Tag>
  );
}
