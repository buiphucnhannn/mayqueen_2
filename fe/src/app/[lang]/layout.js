import { notFound } from "next/navigation";
import BackToTop from "@/components/common/BackToTop";
import { LazyCartDrawer, LazyConsultModal } from "@/components/common/LazyOverlays";
import FloatingContact from "@/components/common/FloatingContact";
import PageTransition from "@/components/fx/PageTransition";
import RememberLang from "@/components/common/RememberLang";
import Preloader from "@/components/fx/Preloader";
import Reveal from "@/components/fx/Reveal";
import SmoothScroll from "@/components/fx/SmoothScroll";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { CartProvider } from "@/context/CartContext";
import { policies } from "@/data/policies";
import { footer, nav, ui } from "@/data/ui";
import { LOCALES, href, isLocale, localize } from "@/i18n";
import { getArticleCategories, getArticles, getProducts } from "@/lib/catalog";
import { FontPreloads, fontClasses } from "@/lib/fonts";
import { skipPreloaderScript } from "@/lib/preloader";
import "../globals.css";
import { jsonLdHtml } from "@/lib/jsonld";
import { DEFAULT_OG_IMAGE, ICONS } from "@/lib/seo";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const site = localize(siteConfig, lang);
  // Quy ước tên tab: "Trang | Mayqueen Slim"; trang chủ: "Mayqueen Slim | khẩu hiệu"
  const title = `${site.name} | ${site.homeTitle}`;
  return {
    metadataBase: new URL(site.url),
    icons: ICONS,
    title: { default: title, template: `%s | ${site.name}` },
    description: site.description,
    keywords: site.keywords,
    applicationName: site.name,
    // canonical / hreflang / og:url KHÔNG đặt ở đây (trang con sẽ kế thừa nhầm link trang chủ) —
    // mỗi trang tự khai báo qua pageMeta() (lib/seo.js). Đây chỉ là mặc định cho trang không khai báo (vd. 404).
    openGraph: {
      type: "website",
      locale: lang === "vi" ? "vi_VN" : "en_US",
      siteName: site.name,
      title,
      description: site.description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description: site.description },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: siteConfig.themeColor,
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const site = localize(siteConfig, lang);
  const [products, articles, articleCategories] = await Promise.all([
    getProducts(),
    getArticles(),
    getArticleCategories(),
  ]);
  const L = localize({ nav, ui, footer, products, policies, articleCategories, articles }, lang);
  // Giỏ hàng (client) chỉ cần tên, ảnh, gói giá — không gửi mô tả / thành phần xuống trình duyệt
  const cartProducts = products.map(
    ({ slug, oldSlugs, urlSlug, category, name, images, options }) => ({
      slug,
      oldSlugs,
      urlSlug,
      category,
      name,
      images: images.slice(0, 1),
      options,
    }),
  );

  // Menu: mục trỏ tới 1 sản phẩm (VD "Combo liệu trình") viết bằng slug tiếng Việt → đổi sang slug đúng
  // ngôn ngữ đang xem (/en/shop/<slug tiếng Anh>), tránh link phải chuyển hướng
  const navLinks = L.nav.map((n) => {
    const [, section, slug] = n.path.split("/");
    const p = section === "san-pham" && slug && products.find((x) => x.urlSlug.vi === slug);
    return p ? { ...n, path: `/san-pham/${p.urlSlug[lang]}` } : n;
  });

  // Cặp slug VI/EN của từng trang chi tiết → nút VI/EN trỏ thẳng đúng đường dẫn ngôn ngữ kia
  const slugPairs = {
    "san-pham": products.map((p) => p.urlSlug),
    "song-dep": articles.map((a) => a.urlSlug),
    "chinh-sach": policies.map((p) => p.urlSlug),
  };

  // Dữ liệu có cấu trúc cho Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    // tên hiển thị = tên thương hiệu (khớp tên tab, logo, nội dung) → Google gom đúng 1 thực thể "Mayqueen Slim"
    name: site.name,
    // tên pháp lý = tên đăng ký tiếng Việt (cả 2 ngôn ngữ); tên tiếng Anh + tên trang chính thức là tên gọi khác
    legalName: siteConfig.company.name.vi,
    alternateName: [site.legalName, siteConfig.company.name.en],
    taxID: site.company.taxId,
    email: site.company.email,
    brand: site.name,
    description: site.description,
    url: site.url + href(lang, "/"),
    telephone: `+84${site.phoneRaw.slice(1)}`,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/images/brand/logo-bot.png`,
    // khoảng giá tự tính từ sản phẩm đang bán (admin đổi giá → tự cập nhật)
    ...(() => {
      const prices = products.flatMap((p) => p.options.map((o) => o.price));
      if (!prices.length) return {};
      const f = (n) => `${n.toLocaleString("vi-VN")}₫`;
      return { priceRange: `${f(Math.min(...prices))} – ${f(Math.max(...prices))}` };
    })(),
    currenciesAccepted: "VND",
    paymentAccepted: "Cash on delivery, Bank transfer",
    // giờ hỗ trợ (config/site.js → openingHours, cùng nguồn với dòng "Giờ làm việc" ở chân trang) → Google Maps /
    // khung doanh nghiệp
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: siteConfig.openingHours.days,
      opens: siteConfig.openingHours.opens,
      closes: siteConfig.openingHours.closes,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+84${site.phoneRaw.slice(1)}`,
      areaServed: "VN",
      availableLanguage: ["Vietnamese", "English"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: site.company.streetAddress,
      addressLocality: "Hà Đông",
      addressRegion: "Hà Nội",
      addressCountry: "VN",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    hasMap: site.mapsLink,
    sameAs: [site.facebook],
  };

  return (
    // suppressHydrationWarning: script ở <head> có thể gắn data-skip-preloader trước khi React hydrate
    <html
      lang={lang}
      translate="no"
      className={`${fontClasses} notranslate`}
      suppressHydrationWarning
    >
      <head>
        {/* Site đã có sẵn bản tiếng Việt + tiếng Anh → tắt gợi ý / tự dịch của trình duyệt (Chrome, Edge,
            Google Translate): kèm translate="no" + class "notranslate" trên <html> (áp dụng mọi layout gốc) */}
        <meta name="google" content="notranslate" />
        {/* Thẻ <script> thuần (KHÔNG dùng next/script): phải chạy đồng bộ trước khi vẽ trang để ẩn màn chào
            không chớp. React chỉ cảnh báo về thẻ này khi render lại <html> phía client, tức khi đổi ngôn ngữ
            — nút VI/EN đã chuyển sang tải trang đầy đủ (LanguageSwitcher) nên không còn tình huống đó. */}
        <script dangerouslySetInnerHTML={{ __html: skipPreloaderScript }} />
      </head>
      <body>
        <FontPreloads />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
        <CartProvider lang={lang} products={cartProducts}>
          <Preloader caption={lang === "vi" ? "Thon gọn từ bên trong" : "Slim from within"} />
          <SmoothScroll />
          <PageTransition />
          <RememberLang lang={lang} />
          <Reveal />
          <Header
            lang={lang}
            slugs={slugPairs}
            nav={navLinks}
            ui={L.ui}
            phone={site.phone}
            phoneRaw={site.phoneRaw}
            searchItems={[
              ...L.products.map((p) => ({
                type: "product",
                title: p.name,
                sub: p.tagline,
                path: `/san-pham/${p.urlSlug}`,
                image: p.images[0],
                // tìm thêm theo mô tả ngắn, loại sản phẩm, công dụng (VD "giảm cân", "thực phẩm bổ sung")
                keywords: [p.short, p.ritual, ...(p.benefits ?? [])].filter(Boolean),
              })),
              ...L.articles.map((a) => ({
                type: "article",
                title: a.title,
                sub: a.excerpt,
                path: `/song-dep/${a.urlSlug}`,
                image: a.cover,
              })),
            ]}
            menuProducts={L.products.map((p) => ({
              slug: p.slug,
              urlSlug: p.urlSlug,
              name: p.name,
              image: p.images[0],
            }))}
          />
          <main>{children}</main>
          <Footer
            lang={lang}
            site={site}
            footer={L.footer}
            products={L.products}
            policies={L.policies}
            articleCategories={L.articleCategories.filter((c) => c.id !== "all")}
          />
          <LazyCartDrawer labels={{ ...L.ui.cart, close: L.ui.close }} />
          <FloatingContact
            phoneRaw={site.phoneRaw}
            zalo={site.zalo}
            messenger={site.messenger}
            labels={L.ui}
          />
          <LazyConsultModal labels={L.ui.consultModal} formLabels={L.ui.form} site={site} />
          <BackToTop label={L.ui.toTop} />
        </CartProvider>
      </body>
    </html>
  );
}
