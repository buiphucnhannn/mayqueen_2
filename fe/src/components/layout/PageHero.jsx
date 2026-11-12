import { getImageProps } from "next/image";
import { preload } from "react-dom";
import Image from "@/components/ui/Img";
import Parallax from "@/components/fx/Parallax";
import Container from "@/components/ui/Container";
import PageHeroCopy from "./PageHeroCopy";
import { backgrounds } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * Banner đầu trang con kiểu Kobler (trang Sản phẩm / Tin tức của web mẫu): ảnh tối tràn ngang nằm DƯỚI
 * header trong suốt, breadcrumb nhỏ ngay dưới header, tiêu đề serif IN HOA (phần accent màu nhấn)
 * + đoạn mô tả serif; đường dẫn (breadcrumb) nằm ngay trên tiêu đề, cả cụm căn GIỮA theo chiều cao.
 * Ảnh nền: ảnh ngang độ phân giải cao, hiển thị nguyên tỉ lệ (không phóng thêm) → sắc nét; parallax nhẹ.
 * Cùng một kích thước cho mọi trang con.
 *
 * mobileImage (tuỳ chọn): ảnh riêng cho điện thoại (khung dọc). Ảnh banner ngang 3:1 trên khung dọc phải
 * phóng ~5 lần → mờ; ảnh vuông thì gần như giữ nguyên độ nét. Dùng <picture> → mỗi thiết bị chỉ tải 1 ảnh.
 */
const MOBILE_MEDIA = "(max-width: 639px)";

export default function PageHero({
  crumbs = [],
  eyebrow,
  title,
  accent,
  text,
  image = backgrounds.moodyLeaves,
  imagePosition = "object-[70%_center]", // phần ảnh ưu tiên giữ khi cắt (chữ nằm bên trái)
  mobileImage,
  mobilePosition = "50%", // điện thoại: vị trí ngang giữ lại khi cắt ảnh vuông vào khung dọc
  children,
  copy, // thay toàn bộ phần chữ (VD PolicyHeroCopy đổi theo trang mà không dựng lại ảnh nền)
}) {
  const common = { alt: "", fill: true, priority: true, quality: 90 };
  let picture = null;
  if (mobileImage) {
    // khung dọc ~400×600: ảnh vuông phủ kín → rộng ≈ 160% chiều ngang màn hình. Chất lượng 80 (ảnh nằm dưới
    // lớp phủ tối) → nhẹ hơn ~40% so với 90 mà mắt không phân biệt được; 4G tải nhanh hơn rõ.
    const mobile = getImageProps({
      ...common,
      quality: 80,
      src: mobileImage,
      sizes: "160vw",
    }).props;
    const { props: desktop } = getImageProps({ ...common, src: image, sizes: "100vw" });
    // báo trước trong <head> đúng ảnh theo cỡ màn hình → tải song song với CSS/JS (ảnh đầu trang = LCP)
    for (const [p, media] of [
      [mobile, MOBILE_MEDIA],
      [desktop, "(min-width: 640px)"],
    ])
      preload(p.src, {
        as: "image",
        imageSrcSet: p.srcSet,
        imageSizes: p.sizes,
        fetchPriority: "high",
        media,
      });
    picture = (
      <picture>
        <source media={MOBILE_MEDIA} srcSet={mobile.srcSet} sizes={mobile.sizes} />
        <img
          {...desktop}
          alt=""
          fetchPriority="high"
          style={{ ...desktop.style, "--mpos": mobilePosition }}
          className={cn("object-cover max-sm:object-[var(--mpos)_center]", imagePosition)}
        />
      </picture>
    );
  }
  return (
    <section className="reveal-now bg-moss text-pearl relative flex h-[clamp(440px,72svh,620px)] overflow-hidden">
      <Parallax speed={0.06} className="media-cap absolute inset-x-0 -inset-y-[6%]">
        <div className="absolute inset-0">
          {picture ?? (
            <Image
              src={image}
              alt=""
              fill
              priority
              quality={90}
              sizes="100vw"
              className={cn("object-cover", imagePosition)}
            />
          )}
        </div>
      </Parallax>
      {/* Hiệu ứng "ảnh hiện dần" = tấm phủ màu nền nhạt dần (KHÔNG làm mờ chính ảnh): Chrome bỏ qua ảnh đang
          mờ (opacity) khi tính LCP → ảnh banner phải luôn rõ; mắt người thấy y hệt ảnh fade-in như trước. */}
      <div
        aria-hidden="true"
        className="bg-moss pointer-events-none absolute inset-0 [animation:mq-cover-out_.9s_ease-out_both]"
      />
      {/* Lớp phủ thống nhất mọi trang con: xanh rêu đậm bên trái (chỗ đặt chữ) nhạt dần sang phải + tối nhẹ trên/dưới */}
      <div className="from-moss via-moss/70 absolute inset-0 hidden bg-gradient-to-r via-40% to-transparent sm:block" />
      <div className="bg-moss/65 absolute inset-0 sm:hidden" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/25" />

      <Container wide className="relative flex w-full flex-col pt-24 pb-10 lg:pt-28 lg:pb-12">
        {/* cả cụm (đường dẫn + tiêu đề + mô tả) căn giữa theo chiều cao vùng dưới header */}
        {/* Link breadcrumb (PageHeroCopy / PolicyHeroCopy): py-2 + -my-2 → vùng chạm 32px, chữ không xê dịch */}
        <div className="my-auto max-w-3xl py-6 [&_nav[aria-label=Breadcrumb]_a]:-my-2 [&_nav[aria-label=Breadcrumb]_a]:inline-flex [&_nav[aria-label=Breadcrumb]_a]:py-2">
          {copy ?? (
            <PageHeroCopy
              crumbs={crumbs}
              eyebrow={eyebrow}
              title={title}
              accent={accent}
              text={text}
            >
              {children}
            </PageHeroCopy>
          )}
        </div>
      </Container>
    </section>
  );
}
