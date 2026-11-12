"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { getImageProps } from "next/image";
import Image from "@/components/ui/Img";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import CircleLink from "@/components/ui/CircleLink";
import { href } from "@/i18n";
import { onIntroDone } from "@/lib/preloader";
import { cn, keepPhrases, noOrphan } from "@/lib/utils";

/**
 * Khối 1 — Hero Slider 3 slide:
 * - Slide 0: Video TVC thương hiệu (không chữ đè, tự chạy, tắt tiếng; nút bật tiếng + tạm dừng dạng viên mờ).
 * - Slide 1: Mayqueen Slim (Sáng đốt mỡ - vóc dáng thon gọn).
 * - Slide 2: Yodetox Extra (Tối thanh lọc - thải độc nhẹ bụng).
 * - Slide ảnh hiện 5s rồi tự chuyển tiếp, hết slide cuối thì quay vòng lại video.
 * - Chấm / thanh chỉ báo ở đáy để chuyển slide linh hoạt.
 * - Mọi kích thước màn hình: slide video chỉ có video + nút bật tiếng / tạm dừng + chấm chuyển slide (không chữ đè).
 * - H1 duy nhất của trang chủ đặt NGOÀI các slide (slide ẩn mang aria-hidden) → trình đọc màn hình / SEO luôn thấy.
 */
const IMAGE_SLIDE_MS = 5000;

const MOBILE = "(max-width: 639px)";
// ảnh khung đầu video đã tối ưu (AVIF/WebP qua /_next/image) — hiện NGAY, là phần tử LCP của trang chủ
// priority: tải ngay + ưu tiên cao (mặc định getImageProps gắn loading="lazy" → trình duyệt tải muộn)
const posterProps = (src) =>
  getImageProps({ src, alt: "", fill: true, priority: true, quality: 75, sizes: "100vw" }).props;
// báo trước trong <head> (theo cỡ màn hình) → trình duyệt tải ảnh song song với CSS/JS, không chờ dựng trang
const preloadPoster = (src, media) => {
  const p = posterProps(src);
  preload(p.src, {
    as: "image",
    imageSrcSet: p.srcSet,
    imageSizes: p.sizes,
    fetchPriority: "high",
    media,
  });
};

export default function HeroVideo({
  lang,
  data,
  video,
  videoMobile,
  poster,
  posterMobile,
  videoStart = 0, // giây bắt đầu phát (bỏ đoạn màn đen đầu video) — xem config/site.js
  legalNote,
}) {
  const ref = useRef(null);
  const [slide, setSlide] = useState(0);
  if (posterMobile) {
    preloadPoster(posterMobile, MOBILE);
    preloadPoster(poster, "(min-width: 640px)");
  } else preloadPoster(poster);
  // Video + ảnh 2 slide sản phẩm chỉ tải SAU khi trang đã hiện xong (window load + lúc rảnh): không tranh
  // băng thông với nội dung đầu trang → mở trang nhanh hơn hẳn trên 4G. Trong lúc chờ: hiện ảnh khung đầu.
  const [media, setMedia] = useState(null); // { src } khi được phép tải
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const productSlides =
    data.slides && data.slides.length > 0
      ? data.slides
      : [
          {
            id: "mayqueen-slim",
            eyebrow: data.eyebrow,
            title: data.title,
            accent: data.accent,
            text: data.text,
            buy: data.buy,
            buyPath: data.buyPath,
            consult: data.consult,
            image: data.image,
          },
        ];

  const totalSlides = 1 + productSlides.length;
  const first = productSlides[0];

  useEffect(() => {
    const start = () =>
      setMedia({ src: videoMobile && matchMedia(MOBILE).matches ? videoMobile : video });
    const idle = () =>
      "requestIdleCallback" in window
        ? requestIdleCallback(start, { timeout: 2500 })
        : setTimeout(start, 300);
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => window.removeEventListener("load", idle);
  }, [video, videoMobile]);

  // Chờ màn chào (Preloader) trượt đi mới phát video → khách xem trọn từ khung đầu. Video vẫn tải sẵn phía sau
  // trong lúc chờ. Dự phòng 4s: màn chào không phát tín hiệu vì lý do nào đó thì vẫn phát.
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const done = () => setIntroDone(true);
    const off = onIntroDone(done);
    const t = setTimeout(done, 4000);
    return () => {
      off();
      clearTimeout(t);
    };
  }, []);

  // Slide video: phát lại từ đầu mỗi lần quay về; tạm dừng khi cuộn khỏi màn hình
  useEffect(() => {
    const v = ref.current;
    if (!v || !media || !introDone) return;
    if (slide !== 0) {
      v.pause();
      return;
    }
    v.currentTime = videoStart;
    let visible = true;
    const play = () => !pausedRef.current && visible && v.play().catch(() => {});
    play();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [slide, media, videoStart, introDone]);

  // Slide ảnh: tự động chuyển sang slide tiếp theo sau khoảng thời gian định trước
  useEffect(() => {
    if (slide === 0) return;
    const id = setTimeout(() => {
      setSlide((curr) => {
        const next = curr + 1;
        if (next >= totalSlides) {
          pausedRef.current = false;
          setPaused(false);
          return 0;
        }
        return next;
      });
    }, IMAGE_SLIDE_MS);
    return () => clearTimeout(id);
  }, [slide, totalSlides]);

  // Chuyển slide thủ công
  const goTo = (i) => {
    if (i === 0) {
      pausedRef.current = false;
      setPaused(false);
    }
    setSlide(i);
  };

  const togglePause = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      pausedRef.current = false;
      setPaused(false);
    } else {
      v.pause();
      pausedRef.current = true;
      setPaused(true);
    }
  };

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const ctrl =
    "grid size-10 place-items-center rounded-full text-white transition hover:bg-white/15";
  const fade = (i) =>
    cn(
      "absolute inset-0 transition-opacity duration-1000 ease-out",
      slide === i ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
    );

  return (
    <section className="text-pearl relative h-[var(--screen)] min-h-[560px] overflow-hidden bg-[#0b160e]">
      {/* "Sân khấu" tối đa 1920px: chữ + ảnh luôn giữ đúng bố cục như ở 100% dù thu/phóng trình duyệt */}
      {/* H1 cho trình đọc màn hình / SEO (cùng nội dung tiêu đề slide 1) — không nằm trong slide aria-hidden */}
      <h1 className="sr-only">
        {first.title} – {first.accent}
      </h1>
      <div className="relative mx-auto h-full max-w-[1920px]">
        {/* ---------- Slide 0: chỉ video ---------- */}
        <div className={fade(0)} aria-hidden={slide !== 0}>
          {/* Ảnh khung đầu (điện thoại: bản cắt dọc riêng) — hiện ngay; video phủ lên khi đã chạy */}
          <picture>
            {posterMobile && (
              <source media={MOBILE} srcSet={posterProps(posterMobile).srcSet} sizes="100vw" />
            )}
            {/* thấp hơn khung 1px (không thấy được): ảnh phủ KÍN đúng 1 màn hình bị Chrome coi là ảnh nền, không
                tính LCP → chờ tới khi video chạy mới tính (rất muộn). Video bên dưới cùng kích thước → không thay. */}
            <img
              {...posterProps(poster)}
              alt=""
              fetchPriority="high"
              style={{ ...posterProps(poster).style, height: "calc(100% - 1px)", bottom: "auto" }}
              className="media-cap object-cover"
            />
          </picture>
          {/* Điện thoại: bản video cắt dọc riêng (nhẹ hơn, đúng khung); máy tính: bản 16:9 */}
          {media && (
            <video
              ref={ref}
              className={cn(
                // nhỏ hơn ảnh khung đầu 1px → Chrome không lấy video thay ảnh làm LCP (video tải sau, rất muộn)
                "media-cap absolute inset-x-0 top-0 h-[calc(100%-2px)] w-full object-cover transition-opacity duration-700",
                playing ? "opacity-100" : "opacity-0",
              )}
              // #t=…: trình duyệt bắt đầu phát ngay từ giây videoStart (bỏ đoạn đen mở màn) — khung đầu trùng ảnh poster
              src={videoStart ? `${media.src}#t=${videoStart}` : media.src}
              // KHÔNG autoPlay: chỉ phát khi màn chào đã xong (effect ở trên gọi play())
              muted
              playsInline
              preload="auto"
              onPlaying={() => setPlaying(true)}
              onEnded={() => setSlide(1)}
              aria-hidden="true"
            />
          )}
          {/* Điện thoại: chỉ làm tối nhẹ đáy để nút điều khiển + chấm chuyển slide nổi rõ (video không chữ đè) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b160e]/60 to-transparent sm:hidden" />
          <div className="absolute inset-x-0 bottom-20 flex justify-center">
            <div className="flex items-center gap-1 rounded-full bg-white/20 p-1.5 backdrop-blur-md">
              <button type="button" onClick={toggleMute} aria-label={data.mute} className={ctrl}>
                {muted ? (
                  <VolumeX className="size-5" strokeWidth={1.5} />
                ) : (
                  <Volume2 className="size-5" strokeWidth={1.5} />
                )}
              </button>
              <button type="button" onClick={togglePause} aria-label={data.pause} className={ctrl}>
                {paused ? (
                  <Play className="size-5" strokeWidth={1.5} />
                ) : (
                  <Pause className="size-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Slides sản phẩm (Slide 1 & Slide 2) ---------- */}
        {productSlides.map((s, idx) => {
          const slideIndex = idx + 1;
          const isActive = slide === slideIndex;
          // H1 của trang nằm ngoài slide (sr-only phía trên) → tiêu đề slide là H2, cùng kiểu chữ
          const Heading = "h2";
          return (
            <div
              key={s.id || idx}
              className={cn(fade(slideIndex), "bg-[#0b160e]")}
              aria-hidden={!isActive}
            >
              {/* Ảnh sản phẩm nền sang trọng - HD siêu nét */}
              <div className="media-cap absolute inset-0 overflow-hidden">
                {/* tải sau khi trang hiện xong (lúc mở trang chưa thấy slide này); điện thoại khung dọc phủ kín
                    → ảnh rộng ≈ 178% chiều cao màn hình */}
                {media && (
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    quality={85}
                    sizes="(max-width: 639px) 178vh, 100vw"
                    className={cn(
                      "object-cover object-[70%_center] transition-transform duration-[8s] ease-out sm:object-[68%_center] lg:object-center",
                      isActive ? "scale-100" : "scale-[1.04]",
                    )}
                  />
                )}
              </div>

              {/* Gradient phủ tinh tế cho khối chữ bên trái, giữ trọn 100% độ sắc nét cho sản phẩm bên phải */}
              <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#0b160e]/90 via-[#0b160e]/55 via-35% to-transparent to-50% sm:block" />
              <div className="pointer-events-none absolute inset-0 bg-[#0b160e]/72 sm:hidden" />

              {/* Khối nội dung chữ & nút CTA */}
              <div className="pointer-events-auto relative flex h-full flex-col justify-center px-5 pt-16 pb-16 sm:px-10 lg:justify-center lg:px-[min(5.5vw,105px)] lg:pt-24 lg:pb-16 [@media(max-height:720px)]:lg:pb-10">
                <div
                  key={`${slideIndex}-${isActive}`}
                  className={cn(
                    "max-w-[560px] max-sm:[text-shadow:0_1px_14px_rgba(0,0,0,.55)] xl:max-w-[620px]",
                    isActive && "[animation:fadeUp_1.1s_cubic-bezier(.22,1,.36,1)_.2s_both]",
                  )}
                >
                  <p className="text-sage-200 sm:text-sage-300 flex items-center gap-3 text-[11px] font-semibold tracking-[0.32em] uppercase">
                    <span className="bg-sage-300 h-px w-8" aria-hidden="true" />
                    {keepPhrases(s.eyebrow)}
                  </p>
                  <Heading className="text-pearl mt-5 font-serif text-[42px] leading-[1.05] font-medium sm:text-[56px] lg:text-[clamp(56px,4.2vw,80px)] [@media(max-height:720px)]:lg:text-[52px]">
                    {keepPhrases(`${s.title} –`)}
                    <span className="text-sage-300 block italic">{s.accent}</span>
                  </Heading>
                  <p className="text-pearl/95 sm:text-pearl/80 mt-6 max-w-[460px] text-[15px] leading-[1.75] sm:text-base [@media(max-height:720px)]:mt-4">
                    {noOrphan(keepPhrases(s.text))}
                  </p>
                  <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-4 [@media(max-height:720px)]:mt-6">
                    <CircleLink href={href(lang, s.buyPath)} light>
                      {s.buy}
                    </CircleLink>
                    <CircleLink data-consult="" light>
                      {s.consult}
                    </CircleLink>
                  </div>
                  <p className="border-pearl/25 text-pearl/80 sm:border-pearl/15 sm:text-pearl/55 mt-10 max-w-[460px] border-t pt-4 text-[11.5px] leading-relaxed [@media(max-height:720px)]:mt-6">
                    {legalNote}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Chấm / Thanh chuyển slide */}
        {/* Chấm nhỏ nhưng vùng chạm 44px (nút bao quanh) → dễ bấm trên điện thoại */}
        <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={slide === i}
              className="group/dot grid size-11 place-items-center"
            >
              <span
                className={cn(
                  "block rounded-full transition-all duration-300",
                  slide === i
                    ? "bg-sage-300 h-2.5 w-7"
                    : "size-2.5 border border-white/80 bg-white/20 group-hover/dot:bg-white/50",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
