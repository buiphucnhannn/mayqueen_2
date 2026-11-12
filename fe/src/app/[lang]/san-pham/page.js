import PageHero from "@/components/layout/PageHero";
import Bestsellers from "@/components/sections/Bestsellers";
import FaqSection from "@/components/sections/FaqSection";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { faqs } from "@/data/faqs";
import { faqHeading, shopPromo } from "@/data/home";
import { heroImages } from "@/data/images";
import { ui } from "@/data/ui";
import { href, localize, t } from "@/i18n";
import { breadcrumbLd, jsonLdHtml } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";
import { getProductCategories, getProducts } from "@/lib/catalog";
import { bundleCount } from "@/lib/live-content";

const copy = {
  // tên tab: từ khóa trước, thương hiệu sau (layout tự thêm " | Mayqueen Slim")
  seoTitle: t(
    "Cửa hàng – Hỗ trợ giảm béo, detox chính hãng",
    "Shop – Authentic weight & detox support",
  ),
  title: t("Cửa hàng", "Shop"),
  accent: t("Mayqueen", "Mayqueen"),
  eyebrow: t("Chính hãng B.O.T Việt Nam", "Authentic B.O.T Vietnam"),
  text: t(
    "Mayqueen Slim hỗ trợ tăng cường chuyển hóa chất béo, Yodetox Extra bổ sung diệp lục tố và vitamin C, cùng 5 combo tiết kiệm.",
    "Mayqueen Slim for fat metabolism, Yodetox Extra for chlorophyll and vitamin C, plus 5 value bundles.",
  ),
};

/** "cùng 5 combo tiết kiệm" → số gói đang giảm giá thật (admin thêm / bớt combo thì tự đổi theo) */
function withBundles(products) {
  const n = bundleCount(products);
  return {
    ...copy,
    text: t(
      copy.text.vi.replace(
        /cùng \d+ combo tiết kiệm/,
        n ? `cùng ${n} combo tiết kiệm` : "cùng các combo liệu trình",
      ),
      copy.text.en.replace(
        /plus \d+ value bundles/,
        n ? `plus ${n} value bundle${n > 1 ? "s" : ""}` : "plus ritual bundles",
      ),
    ),
  };
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const c = localize(withBundles(await getProducts()), lang);
  return pageMeta({
    lang,
    path: { vi: "/san-pham", en: "/san-pham" },
    title: c.seoTitle,
    description: c.text,
  });
}

export default async function ShopPage({ params }) {
  const { lang } = await params;
  const site = localize(siteConfig, lang);
  const [products, categories] = await Promise.all([getProducts(), getProductCategories()]);
  const L = localize(
    { copy: withBundles(products), products, categories, ui, shopPromo, faqs, faqHeading },
    lang,
  );

  // Breadcrumb cho Google (khớp breadcrumb hiển thị): "Mayqueen Slim › /san-pham"
  const crumbsLd = breadcrumbLd([
    { name: L.ui.home, url: site.url + href(lang, "/") },
    { name: lang === "en" ? "Shop" : "Cửa hàng", url: site.url + href(lang, "/san-pham") },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(crumbsLd)} />
      <PageHero
        crumbs={[
          { label: L.ui.home, href: href(lang, "/") },
          { label: `${L.copy.title} ${L.copy.accent}` },
        ]}
        eyebrow={L.copy.eyebrow}
        image={heroImages.mayqueenDark}
        mobileImage={heroImages.mayqueenSquare}
        mobilePosition="76%"
        title={L.copy.title}
        accent={L.copy.accent}
        text={L.copy.text}
      />
      <section className="bg-pearl pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
        <Container wide>
          <Bestsellers
            lang={lang}
            products={L.products}
            categories={L.categories}
            labels={{ ...L.ui, ...L.ui.product }}
            promo={L.shopPromo}
          />
        </Container>
      </section>
      <FaqSection data={L.faqHeading} faqs={L.faqs} phone={site.phone} phoneRaw={site.phoneRaw} />
    </>
  );
}
