import Image from "@/components/ui/Img";
import Parallax from "@/components/fx/Parallax";
import CircleLink from "@/components/ui/CircleLink";
import LuxTitle from "@/components/ui/LuxTitle";
import { href } from "@/i18n";

/**
 * Khối 2 — Câu chuyện thương hiệu (tương ứng "Kiến trúc Pháp" của Kobler): nền tối xanh rêu,
 * ảnh sản phẩm tràn nền (parallax, phóng chậm), chữ bên trái, 4 điểm nhấn dạng lưới 2×2,
 * chữ ký Chủ tịch (tên/chức danh) + nút. Gọn như Kobler: 1 đoạn ngắn, chiều cao vừa nội dung. Toàn bộ là NỘI DUNG MẪU.
 */
export default function BrandStory({ lang, data }) {
  return (
    <section id="cau-chuyen" className="bg-moss text-pearl relative scroll-mt-16 overflow-hidden">
      <Parallax speed={0.1} className="media-cap absolute inset-x-0 -inset-y-[12%] hidden sm:block">
        <div className="reveal absolute inset-0" data-reveal="zoom">
          <Image
            src={data.image}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="object-cover object-[75%_center] sm:object-[78%_center] lg:object-center"
          />
        </div>
      </Parallax>
      {/* Gradient bảo vệ khối chữ bên trái, giữ trọn 100% độ sắc nét cho sản phẩm bên phải */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#0b160e]/95 via-[#0b160e]/65 via-40% to-transparent to-60% sm:block" />

      <div className="section-y relative mx-auto grid max-w-[1440px] px-5 sm:px-10 lg:grid-cols-[minmax(0,540px)_1fr] lg:items-center xl:grid-cols-[minmax(0,600px)_1fr]">
        <div>
          {/* Mobile: ảnh sản phẩm thành khối riêng phía trên, chữ nằm trên nền tối → đọc rõ */}
          <div className="relative -mx-5 -mt-16 mb-10 aspect-[4/3] overflow-hidden sm:hidden">
            <Image
              src={data.image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b160e] via-[#0b160e]/10 to-transparent to-50%" />
          </div>
          <LuxTitle
            eyebrow={data.eyebrow}
            title={data.title}
            accent={data.accent}
            light
            className="[&_h2]:text-balance max-[440px]:[&_h2]:text-[26px]"
          />

          <div className="mt-5 space-y-4">
            {data.paragraphs.map((p, i) => (
              <p
                key={i}
                className="reveal text-pearl/80 text-[15px] leading-relaxed"
                style={{ "--reveal-delay": `${120 + i * 80}ms` }}
              >
                {p}
              </p>
            ))}
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4">
            {data.pillars.map((p, i) => (
              <div key={p.label} className="reveal" style={{ "--reveal-delay": `${i * 90}ms` }}>
                <dt className="text-sage-300 text-[12px] font-semibold tracking-[0.16em] uppercase">
                  {p.label}
                </dt>
                <dd className="text-pearl mt-1 text-[15px]">{p.text}</dd>
              </div>
            ))}
          </dl>

          {/* cùng lưới 2 cột với các điểm nhấn phía trên → chữ ký thẳng hàng cột phải */}
          <div className="reveal mt-9 grid grid-cols-1 items-center gap-x-8 gap-y-6 sm:grid-cols-2">
            <CircleLink href={href(lang, "/san-pham")} light className="justify-self-start">
              {data.cta}
            </CircleLink>
            {/* vạch dọc lùi ra ngoài lề cột → chữ thẳng mép với cột phải. Chưa có tên người ký → ẩn */}
            {data.founder && (
              <p className="border-sage-300/60 border-l-2 pl-4 leading-tight sm:-ml-[18px]">
                <span className="text-pearl block font-serif text-lg">{data.founder}</span>
                <span className="text-pearl/60 mt-1 block text-[11px] tracking-[0.14em] uppercase">
                  {data.founderTitle}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
