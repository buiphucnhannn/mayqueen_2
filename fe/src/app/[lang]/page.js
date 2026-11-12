import BrandStory from "@/components/sections/BrandStory";
import CertificatesSection from "@/components/sections/CertificatesSection";
import HeroVideo from "@/components/sections/HeroVideo";
import IngredientLayers from "@/components/sections/IngredientLayers";
import JournalTeaser from "@/components/sections/JournalTeaser";
import ProductShowcase from "@/components/sections/ProductShowcase";
import TestimonialSlider from "@/components/sections/TestimonialSlider";
import Transformation from "@/components/sections/Transformation";
import { siteConfig } from "@/config/site";
import { certificates, testReports } from "@/data/certificates";
import * as home from "@/data/home";
import { buildIngredientTabs } from "@/data/ingredients";
import { testimonials } from "@/data/testimonials";
import { ui } from "@/data/ui";
import { localize } from "@/i18n";
import { jsonLdHtml } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";
import { getArticleCategories, getArticles, getProducts } from "@/lib/catalog";
import { liveHome } from "@/lib/live-content";
import { preloadAllFonts } from "@/lib/fonts";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const site = localize(siteConfig, lang);
  return pageMeta({
    lang,
    path: { vi: "/", en: "/" },
    title: { absolute: `${site.name} | ${site.homeTitle}` },
    description: site.description,
  });
}

/**
 * Trang chủ v2 — kể chuyện theo phong cách web mẫu Kobler, mỗi khối gần trọn màn hình:
 * 1 Video TVC → đoạn "biến hình" → 2 Câu chuyện thương hiệu → Sản phẩm (combo Sáng – Tối)
 * → 3 Thành phần (tách lớp) → 4 Chứng nhận → 5 Cảm nhận → Sống đẹp → Tư vấn 1:1 → 6 Chân trang (layout).
 */
export default async function HomePage({ params }) {
  preloadAllFonts(); // màn đầu dùng cả serif nghiêng + sans 500/700 (xem lib/fonts.js)
  const { lang } = await params;
  const site = localize(siteConfig, lang);
  const [products, articles, articleCategories] = await Promise.all([
    getProducts(),
    getArticles(),
    getArticleCategories(),
  ]);
  const L = localize(
    {
      // banner, câu chuyện, khối sản phẩm, chứng nhận: phần nhắc tới sản phẩm lấy từ dữ liệu Admin
      ...liveHome(home, products),
      ui,
      products,
      testimonials,
      articles,
      articleCategories,
      certificates,
      testReports,
      ingredientTabs: buildIngredientTabs(products),
    },
    lang,
  );
  const categoryLabels = Object.fromEntries(L.articleCategories.map((c) => [c.id, c.label]));
  // Tên trang web cho Google (đặt ở trang chủ): kết quả tìm kiếm hiện "Mayqueen Slim" cạnh logo thay vì tên miền
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: [site.legalName, "MayqueenSlim"],
    url: `${site.url}/`,
    inLanguage: lang === "vi" ? "vi-VN" : "en-US",
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: `${site.url}/images/brand/logo-bot.png`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(websiteLd)} />
      <HeroVideo
        lang={lang}
        data={L.hero}
        video={site.heroVideo}
        poster={site.heroPoster}
        videoMobile={site.heroVideoMobile}
        posterMobile={site.heroPosterMobile}
        videoStart={site.heroVideoStart}
        legalNote={L.legalNote}
      />
      <Transformation data={L.transformation} />
      <BrandStory lang={lang} data={L.story} />
      <ProductShowcase
        lang={lang}
        data={L.showcase}
        products={L.products}
        labels={{ ...L.ui, ...L.ui.product }}
      />
      <IngredientLayers lang={lang} data={L.ingredientsHeading} tabs={L.ingredientTabs} />
      <CertificatesSection
        data={L.certificatesHeading}
        certificates={L.certificates}
        reports={L.testReports}
        labels={{ view: L.ui.view }}
      />
      {site.showTestimonials && (
        <TestimonialSlider data={L.testimonialsHeading} reviews={L.testimonials} />
      )}
      <JournalTeaser
        lang={lang}
        data={L.journalTeaser}
        articles={L.articles}
        categoryLabels={categoryLabels}
        labels={L.ui}
      />
    </>
  );
}
