import { Clock, Phone } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import PolicyHeroCopy from "@/components/policy/PolicyHeroCopy";
import PolicyNav from "@/components/policy/PolicyNav";
import StickySide from "@/components/policy/StickySide";
import { MessengerIcon, ZaloIcon } from "@/components/ui/BrandIcons";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { backgrounds } from "@/data/images";
import { policies } from "@/data/policies";
import { footer, ui } from "@/data/ui";
import { href, localize } from "@/i18n";
import { cn } from "@/lib/utils";

/** Khung "Cần hỗ trợ?" — thẻ trắng đồng bộ với thẻ menu phía trên; nút "Tư vấn" xanh đậm làm điểm nhấn */
// Bố cục: tiêu đề | 2 dòng thông tin cùng 1 cột biểu tượng (chữ thẳng hàng) | đường kẻ | 3 nút cùng chiều cao 40px
function HelpCard({ site, L, className }) {
  const icon =
    "bg-sage-50 text-sage-700 grid size-10 shrink-0 place-items-center rounded-full transition-colors";
  const label = "text-ink-muted block text-[11px] leading-none tracking-[0.12em] uppercase";
  const btn =
    "flex h-10 items-center justify-center gap-2 rounded-full text-[12px] font-semibold transition";
  const chip = `${btn} border-forest/15 text-forest hover:border-forest hover:bg-forest hover:text-pearl border`;
  return (
    <div className={cn("border-forest/10 rounded-2xl border bg-white p-5", className)}>
      <p className="text-sage-700 text-[11px] font-semibold tracking-[0.22em] uppercase">
        {L.footer.needHelp}
      </p>

      <div className="mt-4 space-y-3">
        <a href={`tel:${site.phoneRaw}`} className="group flex items-center gap-3.5">
          <span className={cn(icon, "group-hover:bg-forest group-hover:text-pearl")}>
            <Phone className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={label}>{L.footer.hotline}</span>
            <span className="text-forest group-hover:text-sage-700 mt-1.5 block text-[19px] leading-none font-semibold whitespace-nowrap transition-colors">
              {site.phone}
            </span>
          </span>
        </a>
        <div className="flex items-center gap-3.5">
          <span className={icon}>
            <Clock className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={label}>{L.footer.hours}</span>
            <span className="text-ink-soft mt-1.5 block text-[13.5px] leading-tight">
              {site.hours}
            </span>
          </span>
        </div>
      </div>

      <div className="border-forest/10 mt-4 grid grid-cols-2 gap-2 border-t pt-4">
        <a href={site.zalo} target="_blank" rel="noopener noreferrer" className={chip}>
          <ZaloIcon className="size-4" /> Zalo
        </a>
        <a href={site.messenger} target="_blank" rel="noopener noreferrer" className={chip}>
          <MessengerIcon className="size-4" /> Messenger
        </a>
        <button
          type="button"
          data-consult
          className={`${btn} bg-forest text-pearl hover:bg-sage-700 col-span-2 tracking-[0.14em] uppercase`}
        >
          {L.ui.consult}
        </button>
      </div>
    </div>
  );
}

/**
 * Khung chung của các trang chính sách: banner + thanh bên (menu + hỗ trợ, dính cùng nhau khi cuộn) + nội dung.
 * Là LAYOUT nên Next giữ nguyên (không dựng lại) khi đổi chính sách — chỉ phần nội dung ({children},
 * từ [slug]/page.js) thay đổi.
 * - Laptop+: 2 cột — thanh bên trái sticky (thẻ menu + thẻ hỗ trợ, cùng nền trắng) | nội dung trải theo khung rộng 1440px.
 * - Điện thoại / tablet: hàng chip cuộn ngang ở trên, khung hỗ trợ xuống cuối nội dung.
 */
export default async function PolicyLayout({ children, params }) {
  const { lang } = await params;
  const site = localize(siteConfig, lang);
  const L = localize({ ui, footer, policies }, lang);

  return (
    <>
      {/* Banner chung (ảnh nền đứng yên) — chỉ phần chữ đổi theo chính sách đang xem (PolicyHeroCopy) */}
      <PageHero
        image={backgrounds.fernGlow}
        imagePosition="object-[70%_40%]"
        copy={
          <PolicyHeroCopy
            home={{ label: L.ui.home, href: href(lang, "/") }}
            items={L.policies.map((x) => ({
              href: href(lang, `/chinh-sach/${x.urlSlug}`),
              crumb: x.title,
              ...x.hero,
            }))}
          />
        }
      />
      <section className="bg-pearl section-y">
        <Container
          wide
          className="grid gap-10 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-20"
        >
          {/* Thanh bên: menu + hỗ trợ dính cùng nhau khi cuộn; màn thấp thì tự canh để luôn thấy trọn (StickySide) */}
          <StickySide className="reveal min-w-0 lg:sticky lg:top-28 lg:self-start">
            <PolicyNav
              items={L.policies.map((x) => ({
                slug: x.slug,
                title: x.title,
                href: href(lang, `/chinh-sach/${x.urlSlug}`),
              }))}
              label={L.footer.policies}
            />
            <HelpCard site={site} L={L} className="mt-4 hidden lg:block" />
          </StickySide>

          {/* nội dung chính sách (page.js) — phần DUY NHẤT đổi khi chọn chính sách khác */}
          <div className="min-w-0">
            <article id="policy-content" className="scroll-mt-28">
              {children}
            </article>
            {/* điện thoại / tablet: hỗ trợ ở cuối nội dung */}
            <HelpCard site={site} L={L} className="mt-12 max-w-md lg:hidden" />
          </div>
        </Container>
      </section>
    </>
  );
}
