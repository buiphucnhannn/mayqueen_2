import Image from "@/components/ui/Img";
import Container from "@/components/ui/Container";
import { FacebookIcon, TikTokIcon, ZaloIcon } from "@/components/ui/BrandIcons";
import SplitText from "@/components/fx/SplitText";
import { backgrounds } from "@/data/images";

/**
 * Cộng đồng: tiêu đề + nút mạng xã hội (Facebook, TikTok, Zalo) trên ảnh nền lá non ngược sáng.
 * Lớp phủ xanh rêu đậm ở bên chữ, nhạt dần sang phải để lộ lá & đốm sáng → chữ luôn dễ đọc.
 */
export default function SocialFeed({ data, site }) {
  // brand: màu nhận diện của từng mạng (vòng tròn icon) → nhìn là biết ngay
  const socials = [
    { label: "Facebook", url: site.facebook, Icon: FacebookIcon, brand: "bg-[#1877F2]" },
    { label: "TikTok", url: site.tiktok, Icon: TikTokIcon, brand: "bg-[#111111]" },
    { label: "Zalo", url: site.zalo, Icon: ZaloIcon, brand: "bg-[#0068FF]" },
  ].filter((s) => s.url); // mạng nào chưa có link (VD TikTok) → ẩn icon

  return (
    <section className="bg-forest text-pearl section-y relative isolate overflow-hidden">
      <Image
        src={backgrounds.bokehLeaves}
        alt=""
        fill
        sizes="100vw"
        quality={70}
        className="media-cap -z-20 object-cover object-[center_35%] brightness-[1.18] saturate-[1.12]"
      />
      {/* điện thoại: phủ đều (chữ căn giữa); máy tính: đậm bên chữ, nhạt dần sang phải */}
      <div
        aria-hidden="true"
        className="from-forest/80 via-forest/60 to-forest/40 lg:from-forest/85 lg:via-forest/45 lg:to-forest/30 absolute inset-0 -z-10 bg-linear-to-b lg:bg-linear-to-r"
      />
      {/* máy tính: quầng tối loang mềm ngay sau cụm biểu tượng (vùng lá sáng nhất) → chữ + icon tách khỏi nền
          mà không cần khung bao */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-[radial-gradient(ellipse_30%_65%_at_84%_50%,rgba(12,28,17,.62),transparent_72%)] lg:block"
      />

      <Container
        wide
        className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left"
      >
        <div>
          <p className="reveal eyebrow text-sage-300!">{data.eyebrow}</p>
          <SplitText
            text={data.title}
            className="h-display text-pearl! mt-4 text-[28px] [text-shadow:0_2px_18px_rgba(10,25,15,.45)] sm:text-[34px] lg:text-[44px]"
          />
          <p className="reveal text-sage-100 mt-3 font-serif text-xl italic [text-shadow:0_1px_10px_rgba(10,25,15,.5)]">
            {data.handle}
          </p>
        </div>
        {/* Không khung bao: biểu tượng tròn màu thương hiệu (to, viền sáng + quầng sáng) + chữ trắng có bóng
            → tự nổi trên nền lá mà vẫn thoáng, nhẹ */}
        <ul className="reveal flex flex-wrap justify-center gap-x-8 gap-y-4 sm:gap-x-10">
          {socials.map(({ label, url, Icon, brand }) => (
            <li key={label}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-pearl flex items-center gap-3.5 rounded-full text-[16px] font-semibold tracking-wide [text-shadow:0_2px_12px_rgba(5,15,8,.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[17px]"
              >
                <span
                  className={`${brand} grid size-14 shrink-0 place-items-center rounded-full text-white shadow-[0_10px_28px_-6px_rgba(5,15,8,.7),0_0_0_6px_rgba(255,255,255,.12)] ring-2 ring-white/80 transition duration-300 group-hover:scale-110 group-hover:shadow-[0_14px_32px_-6px_rgba(5,15,8,.75),0_0_0_9px_rgba(255,255,255,.18)]`}
                >
                  <Icon className="size-6" />
                </span>
                <span className="decoration-pearl/70 underline-offset-[6px] group-hover:underline">
                  {label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
