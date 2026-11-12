"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/ui/Img";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import LuxTitle from "@/components/ui/LuxTitle";
import Stars from "@/components/ui/Stars";
import { cn } from "@/lib/utils";
import { NAV_LABELS, usePageLang } from "@/hooks/usePageLang";

/**
 * Khối 5 — Cảm nhận khách hàng (tương ứng "Công trình tiêu biểu" của Kobler).
 *
 * Slider VÔ HẠN kiểu "băng chuyền quấn vòng": vị trí là 1 số thực tăng/giảm mãi; mỗi thẻ tự tính chỗ
 * của mình theo phép chia lấy dư → thẻ trôi khỏi mép này thì xuất hiện lại ở mép kia (ngoài khung nhìn).
 * Không có bản sao, không có cú "nhảy về giữa", không phụ thuộc transitionend → không thể lệch / lộ trống.
 *
 * Chuyển động do 1 vòng requestAnimationFrame điều khiển, ghi thẳng transform (không render lại React):
 * - Trượt tới đích theo hàm mũ (ease-out tự nhiên); đổi hướng giữa chừng vẫn liền mạch.
 * - Kéo chuột / vuốt tay: thẻ bám tay 1:1; thả ra cộng thêm đà (quán tính) rồi dừng đúng mép thẻ.
 * - Tự lướt 1 thẻ mỗi 5s; dừng khi rê chuột, khi khối ngoài màn hình hoặc tab bị ẩn.
 * - Ảnh tải sẵn (eager) → thẻ quấn vòng sang luôn có ảnh, không "load chưa kịp".
 */
const AUTOPLAY_MS = 5000;
const GAP = 20;
const TAU = 150; // ms — hằng số thời gian trượt (nhỏ = nhanh); ~4·TAU là dừng hẳn
const FLING = 260; // ms — đà vuốt: quãng thêm (thẻ) = vận tốc lúc thả (thẻ/ms) × FLING

const mod = (a, n) => ((a % n) + n) % n;

export default function TestimonialSlider({ data, reviews, className }) {
  const navT = NAV_LABELS[usePageLang()];
  const viewportRef = useRef(null);
  const itemRefs = useRef([]);
  const [perView, setPerView] = useState(4);
  const [dragging, setDragging] = useState(false);

  // Cần ít nhất perView + 2 thẻ để luôn có 1 thẻ chờ ngoài mỗi mép → nhân danh sách nếu thiếu
  const copies = Math.max(1, Math.ceil((perView + 2) / reviews.length));
  const list = Array.from({ length: copies }, () => reviews).flat();
  const N = list.length;

  // Trạng thái chuyển động (ref — đổi mỗi khung hình, không render lại)
  const m = useRef({ pos: 0, target: 0, step: 0, raf: 0, last: 0, drag: null });
  const flags = useRef({ hover: false, visible: false });
  const autoRef = useRef(0);

  // Vẽ: đặt từng thẻ theo vị trí hiện tại
  const paint = () => {
    const { pos, step } = m.current;
    if (!step) return;
    for (let i = 0; i < N; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      let rel = mod(i - pos, N);
      if (rel >= N - 1) rel -= N; // 1 chỗ chờ bên trái, phần còn lại bên phải
      el.style.transform = `translate3d(${(rel * step).toFixed(2)}px, 0, 0)`;
    }
  };

  const frame = (t) => {
    const s = m.current;
    const dt = Math.min(64, s.last ? t - s.last : 16);
    s.last = t;
    if (!s.drag) {
      const d = s.target - s.pos;
      s.pos = Math.abs(d) < 0.0005 ? s.target : s.pos + d * (1 - Math.exp(-dt / TAU));
    }
    paint();
    if (s.drag || s.pos !== s.target) s.raf = requestAnimationFrame(frame);
    else s.raf = 0;
  };
  const run = () => {
    const s = m.current;
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(frame);
    }
  };

  // Tự lướt: hẹn lại 5s sau mỗi lần tương tác
  const schedule = () => {
    clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      const f = flags.current;
      if (!f.hover && f.visible && !document.hidden && !m.current.drag) {
        m.current.target = Math.round(m.current.target) + 1;
        run();
      }
      schedule();
    }, AUTOPLAY_MS);
  };

  // Bấm dồn dập: đích không vượt quá 1 khung thẻ so với chỗ đang thấy (không quay vèo cả chục thẻ)
  const capTarget = (t) => {
    const p = Math.round(m.current.pos);
    return Math.max(p - perView, Math.min(p + perView, t));
  };
  const move = (d) => {
    m.current.target = capTarget(Math.round(m.current.target) + d);
    run();
    schedule();
  };

  // Đo bề rộng thẻ → bước + số thẻ hiện cùng lúc
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const card = itemRefs.current[0];
      if (!card) return;
      const step = card.getBoundingClientRect().width + GAP;
      m.current.step = step;
      setPerView(Math.max(1, Math.round((vp.clientWidth + GAP) / step)));
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paint đọc ref, chỉ cần đo lại khi số thẻ đổi
  }, [N]);

  // Ảnh các thẻ: chỉ tải khi khách cuộn tới GẦN khu này (cách ~1 màn hình) — rồi tải hết 1 lượt để vuốt không
  // bị ô trống. Trước đây tải ngay khi mở trang (eager) dù khu này ở cuối trang → giành băng thông đầu trang.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(vp);
    return () => io.disconnect();
  }, []);

  // Chỉ tự chạy khi khối trên màn hình; dọn hẹn giờ + vòng vẽ khi gỡ
  useEffect(() => {
    const vp = viewportRef.current;
    const io = new IntersectionObserver(([e]) => (flags.current.visible = e.isIntersecting), {
      threshold: 0.3,
    });
    if (vp) io.observe(vp);
    schedule();
    const s = m.current;
    return () => {
      io.disconnect();
      clearTimeout(autoRef.current);
      cancelAnimationFrame(s.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy 1 lần
  }, []);

  // ---- Kéo / vuốt có quán tính ----
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!m.current.step) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // chộp đúng vị trí đang thấy (kể cả khi đang trượt dở)
    m.current.drag = {
      x0: e.clientX,
      p0: m.current.pos,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
    };
    setDragging(true);
    run();
  };
  const onPointerMove = (e) => {
    const d = m.current.drag;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    const inst = -(e.clientX - d.lastX) / m.current.step / dt; // thẻ/ms
    d.v = d.v * 0.65 + inst * 0.35;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    m.current.pos = d.p0 - (e.clientX - d.x0) / m.current.step;
  };
  const onPointerEnd = (e) => {
    const s = m.current;
    const d = s.drag;
    if (!d) return;
    s.drag = null;
    const v = e.timeStamp - d.lastT > 90 ? 0 : d.v; // đã dừng tay thì không còn đà
    s.target = capTarget(Math.round(s.pos + v * FLING));
    setDragging(false);
    run();
    schedule();
  };

  const arrow =
    "border-forest/20 text-forest hover:bg-forest hover:border-forest absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full border bg-white/90 shadow-[0_10px_30px_-12px_rgba(20,42,28,.4)] backdrop-blur transition-colors duration-300 hover:text-white sm:grid";

  return (
    <section id="cam-nhan" className={cn("bg-linen section-y scroll-mt-16", className)}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <LuxTitle
          eyebrow={data.eyebrow}
          title={data.title}
          accent={data.accent}
          text={data.text}
          align="center"
        />

        <div
          className="relative mt-12"
          onMouseEnter={() => (flags.current.hover = true)}
          onMouseLeave={() => (flags.current.hover = false)}
        >
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={navT.prev}
            className={cn(arrow, "-left-3 lg:-left-6")}
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={navT.next}
            className={cn(arrow, "-right-3 lg:-right-6")}
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>

          <div
            ref={viewportRef}
            className={cn(
              "-mx-5 overflow-hidden px-5 py-3 select-none sm:mx-0 sm:px-0",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ touchAction: "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            {/* mọi thẻ chồng cùng 1 ô lưới (cao = thẻ cao nhất), vị trí ngang do transform */}
            <ul className="grid">
              {list.map((r, i) => (
                <li
                  key={i}
                  ref={(el) => (itemRefs.current[i] = el)}
                  className="col-start-1 row-start-1 flex w-[82%] will-change-transform sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]"
                  style={{ transform: `translate3d(${i * 110}%, 0, 0)` }}
                >
                  <article
                    className="reveal group bg-cream flex w-full flex-col overflow-hidden rounded-xl shadow-[0_18px_40px_-28px_rgba(20,42,28,.45)]"
                    style={{ "--reveal-delay": `${(i % 4) * 90}ms` }}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={r.image}
                        alt=""
                        fill
                        loading={near ? "eager" : "lazy"}
                        draggable={false}
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 82vw"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between">
                        <Stars value={r.rating} />
                        <Quote className="text-sage-200 size-6" aria-hidden="true" />
                      </div>
                      {/* đoạn cảm nhận cố định 4 dòng → đường kẻ + tên các thẻ luôn ngang hàng */}
                      <blockquote className="text-ink mt-3 line-clamp-4 min-h-[6.5em] text-[14.5px] leading-[1.625]">
                        “{r.text}”
                      </blockquote>
                      <div className="border-forest/10 mt-5 border-t pt-4">
                        <p className="text-forest text-[18px] font-medium uppercase">{r.name}</p>
                        <p className="text-ink-muted mt-0.5 line-clamp-2 min-h-[2.9em] text-[12.5px] leading-[1.45] tracking-[0.06em] uppercase">
                          {r.meta} - {r.product}
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
