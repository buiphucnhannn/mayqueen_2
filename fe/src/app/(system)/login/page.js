import { Suspense } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";
import { brand, heroImages } from "@/data/images";
import LoginForm from "./LoginForm";

export const metadata = { title: "Đăng nhập quản trị" };

/**
 * Trang đăng nhập quản trị — 2 cột: ảnh thương hiệu nền tối (trái) - form căn giữa (phải).
 * Mobile (như TranDuyMedia): ẩn cột ảnh, chỉ còn form căn giữa màn hình + logo phía trên, link "Về trang chủ" góc trên.
 */
export default function LoginPage() {
  return (
    <main className="bg-linen grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* ---------- Cột thương hiệu ---------- */}
      <aside className="bg-moss text-pearl relative isolate hidden min-h-svh flex-col justify-between overflow-hidden p-14 lg:flex">
        <Image
          src={heroImages.login}
          alt=""
          fill
          priority
          quality={90}
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="-z-10 object-cover object-[80%_center]"
        />
        <div className="from-moss via-moss/75 absolute inset-0 -z-10 bg-gradient-to-r via-35% to-transparent to-65%" />
        <div className="from-moss/80 absolute inset-0 -z-10 bg-gradient-to-t via-transparent to-transparent" />

        <Link href="/" aria-label="Mayqueen Slim" className="inline-flex self-start">
          <Image
            src={brand.horizontalWhite}
            alt="B.O.T"
            width={357}
            height={136}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <div className="max-w-sm">
          <p className="text-sage-300 flex items-center gap-3 text-[11px] font-semibold tracking-[0.32em] uppercase">
            <span className="bg-sage-300 h-px w-8" aria-hidden="true" />
            B.O.T Việt Nam - Quản trị
          </p>
          <h2 className="mt-5 font-serif text-[52px] leading-[1.05] font-medium">
            Mayqueen Slim<span className="text-sage-300 block italic">&amp; Yodetox Extra</span>
          </h2>
          <p className="text-pearl/75 mt-5 text-[15px] leading-relaxed">
            Quản lý đơn hàng, khách đăng ký tư vấn và sản phẩm của Mayqueen tại một nơi.
          </p>
        </div>

        <p className="text-pearl/45 text-[11px] tracking-[0.2em] uppercase">
          © {siteConfig.copyrightYear} {siteConfig.legalName} - B.O.T Việt Nam
        </p>
      </aside>

      {/* ---------- Cột đăng nhập ---------- */}
      {/* mobile: vừa đúng 1 màn hình (h-svh), khoảng cách gọn; desktop: thoáng hơn */}
      <section className="relative flex h-svh min-h-[600px] items-center justify-center px-5 pt-12 pb-6 sm:px-10 lg:h-auto lg:min-h-svh lg:pt-20 lg:pb-14">
        <Link
          href="/"
          className="text-ink-soft hover:text-forest absolute top-5 left-5 inline-flex items-center gap-2 text-sm font-medium transition-colors sm:top-6 sm:left-10"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Về trang chủ
        </Link>

        <div className="w-full max-w-[400px] xl:max-w-[440px]">
          {/* tiêu đề căn giữa cột */}
          <div className="flex flex-col items-center text-center">
            <Image
              src={brand.horizontal}
              alt="B.O.T"
              width={357}
              height={136}
              priority
              className="mb-7 h-9 w-auto sm:h-11 lg:hidden"
            />
            <p className="text-sage-600 text-[11px] font-semibold tracking-[0.3em] uppercase">
              Khu vực bảo mật
            </p>
            <h1 className="h-lux mt-3 text-[30px] sm:text-[40px] xl:text-[44px]">
              Đăng nhập
              <span className="accent">Quản trị</span>
            </h1>
            <p className="text-ink-soft mt-3 text-sm sm:mt-4 sm:text-[15px]">
              Dành riêng cho quản trị viên Mayqueen.
            </p>
          </div>

          <Suspense fallback={<div className="mt-8 h-[300px]" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
