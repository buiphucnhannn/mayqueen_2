import CheckoutForm from "@/components/forms/CheckoutForm";
import PageHero from "@/components/layout/PageHero";
import Container from "@/components/ui/Container";
import { heroImages } from "@/data/images";
import { ui } from "@/data/ui";
import { href, localize } from "@/i18n";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const L = localize(ui.checkout, lang);
  return {
    ...pageMeta({
      lang,
      path: { vi: "/thanh-toan", en: "/thanh-toan" },
      title: L.seoTitle,
      description: L.text,
    }),
    robots: { index: false }, // trang đặt hàng không cần lên Google
  };
}

export default async function CheckoutPage({ params }) {
  const { lang } = await params;
  const L = localize(ui, lang);

  return (
    <>
      <PageHero
        image={heroImages.yodetoxDark}
        mobileImage={heroImages.yodetoxSquare}
        mobilePosition="58%"
        crumbs={[{ label: L.home, href: href(lang, "/") }, { label: L.checkout.title }]}
        eyebrow={L.checkout.eyebrow}
        title={L.checkout.heroTitle}
        accent={L.checkout.heroAccent}
        text={L.checkout.text}
      />
      <section className="bg-cream section-y">
        <Container wide>
          <CheckoutForm labels={L.checkout} />
        </Container>
      </section>
    </>
  );
}
