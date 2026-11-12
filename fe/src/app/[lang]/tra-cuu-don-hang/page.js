import TrackOrderForm from "@/components/forms/TrackOrderForm";
import PageHero from "@/components/layout/PageHero";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { heroImages } from "@/data/images";
import { ui } from "@/data/ui";
import { href, localize } from "@/i18n";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const L = localize(ui.track, lang);
  return {
    ...pageMeta({
      lang,
      path: { vi: "/tra-cuu-don-hang", en: "/tra-cuu-don-hang" },
      title: L.seoTitle,
      description: L.text,
    }),
    // trang công cụ riêng của khách (cần mã đơn + SĐT) → không cần lên Google
    robots: { index: false, follow: true },
  };
}

export default async function TrackOrderPage({ params }) {
  const { lang } = await params;
  const L = localize(ui, lang);
  const site = localize(siteConfig, lang);

  return (
    <>
      <PageHero
        image={heroImages.mayqueenDark}
        mobileImage={heroImages.mayqueenSquare}
        crumbs={[{ label: L.home, href: href(lang, "/") }, { label: L.track.title }]}
        eyebrow={L.track.eyebrow}
        title={L.track.heroTitle}
        accent={L.track.heroAccent}
        text={L.track.text}
      />
      <section className="bg-cream section-y">
        <Container wide>
          <TrackOrderForm
            lang={lang}
            labels={L.track}
            hotline={{ phone: site.phone, phoneRaw: site.phoneRaw, label: L.call }}
          />
        </Container>
      </section>
    </>
  );
}
