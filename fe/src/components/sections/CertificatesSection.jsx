"use client";

import { useState } from "react";
import Image from "@/components/ui/Img";
import { ChevronRight } from "lucide-react";
import CountUp from "@/components/fx/CountUp";
import dynamic from "next/dynamic";

// trình xem ảnh chỉ mở khi bấm → file JS riêng, tải sau khi trang đã hiện (không nằm trên đường tải đầu trang)
const Lightbox = dynamic(() => import("@/components/ui/Lightbox"));
import { backgrounds } from "@/data/images";

/**
 * Khối 4 — Chứng nhận (tương ứng "Niềm tin tạo nên lựa chọn" của Kobler): nền tối, ảnh nền chìm bên phải,
 * tiêu đề 1 dòng căn giữa; ô bo góc viền mảnh: đầu ô là tên giấy căn giữa + đường kẻ ngang,
 * thân ô là ảnh giấy, cuối ô là đơn vị cấp + "XEM GIẤY" + vòng tròn mũi tên.
 * 12 ô CÙNG MỘT KIỂU: 3 giấy chứng nhận chính + 9 phiếu kiểm nghiệm nguyên liệu (ô chưa có ảnh bị ẩn).
 * Bấm ô → lightbox, lướt được qua toàn bộ giấy. Dưới cùng: 4 con số thật (số chạy).
 */
export default function CertificatesSection({ data, certificates, reports = [], labels }) {
  const [open, setOpen] = useState(null); // index đang xem

  // Gộp giấy chính + phiếu kiểm nghiệm thành 1 danh sách ô giống hệt nhau
  const cards = [
    ...certificates
      .filter((c) => c.images.length)
      .map((c) => ({ id: c.id, title: c.title, issuer: c.issuer, image: c.images[0] })),
    ...reports.map((r, i) => ({
      id: r.image,
      title: r.name,
      issuer: r.issuer,
      image: r.image,
      tag: `${data.reportsTitle} ${String(i + 1).padStart(2, "0")}`,
    })),
  ];
  const items = cards.map((c) => ({ src: c.image, caption: c.title, text: c.issuer }));

  return (
    <section
      id="chung-nhan"
      className="bg-moss text-pearl section-y relative scroll-mt-16 overflow-hidden"
    >
      <div className="absolute inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent_10%,#000_70%)] opacity-60 lg:w-2/3">
        <Image
          src={backgrounds.moodyLeaves}
          alt=""
          fill
          sizes="66vw"
          quality={60}
          className="object-cover"
        />
      </div>
      <div className="from-moss/40 to-moss absolute inset-0 bg-gradient-to-b via-transparent" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10">
        <h2 className="reveal h-lux text-pearl text-center text-[30px] sm:text-[38px] lg:text-[46px]">
          {data.title} {data.accent}
        </h2>
        <p
          className="reveal text-pearl/75 mx-auto mt-4 max-w-2xl text-center text-[15px] leading-relaxed"
          style={{ "--reveal-delay": "120ms" }}
        >
          {data.text}
        </p>

        {/* mobile: lưới 2 cột gọn (12 giấy không kéo dài 6 màn hình); tablet 2 cột, desktop 3 cột */}
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {cards.map((c, i) => (
            <li key={c.id} className="reveal" style={{ "--reveal-delay": `${(i % 3) * 100}ms` }}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group border-pearl/35 hover:border-sage-300 flex h-full w-full cursor-zoom-in flex-col overflow-hidden rounded-xl border bg-black/15 text-left backdrop-blur-[2px] transition-colors duration-500 sm:rounded-2xl"
              >
                <span className="border-pearl/35 flex min-h-[78px] flex-col items-center justify-center border-b px-2.5 py-3 text-center sm:min-h-[104px] sm:px-5 sm:py-4">
                  {c.tag && (
                    <span className="text-sage-300 mb-1 block text-[10.5px] font-semibold tracking-[0.12em] uppercase sm:text-[11px] sm:tracking-[0.2em]">
                      {c.tag}
                    </span>
                  )}
                  <span className="text-pearl line-clamp-3 block font-serif text-[14px] leading-snug uppercase sm:line-clamp-2 sm:text-[20px] lg:text-[22px]">
                    {c.title}
                  </span>
                </span>
                <span className="relative block aspect-[4/5] overflow-hidden sm:aspect-[16/10]">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, 45vw"
                    className="object-contain p-3 transition duration-700 group-hover:scale-[1.04] sm:p-4"
                  />
                </span>
                <span className="mt-auto flex items-center justify-center gap-4 px-3 pt-1 pb-3.5 sm:justify-between sm:px-5 sm:pt-2 sm:pb-5">
                  <span className="text-pearl/70 hidden text-[13px] leading-snug sm:block">
                    {c.issuer}
                  </span>
                  <span className="link-circle text-pearl shrink-0 max-sm:gap-2 max-sm:text-[10.5px]">
                    {labels.view}
                    <span className="border-pearl/70 group-hover:bg-pearl group-hover:text-forest grid size-7 place-items-center rounded-full border transition-colors duration-300 sm:size-9">
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Con số nổi bật — chỉ số liệu có thật */}
        <dl className="border-pearl/15 mt-14 grid grid-cols-2 gap-y-8 border-t pt-10 lg:grid-cols-4">
          {data.stats.map((s, i) => (
            <div
              key={s.label}
              className="reveal text-center"
              style={{ "--reveal-delay": `${i * 100}ms` }}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp
                  value={s.value}
                  suffix={s.suffix}
                  className="text-pearl block font-serif text-[52px] leading-none sm:text-[64px]"
                />
                <span className="text-sage-200/85 mt-2 block text-[12px] tracking-[0.14em] uppercase">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Lightbox
        items={items}
        index={open}
        onChange={setOpen}
        onClose={() => setOpen(null)}
        document
      />
    </section>
  );
}
