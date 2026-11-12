import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, Info, Leaf } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import TestimonialSlider from "@/components/sections/TestimonialSlider";
import Disclosure from "@/components/ui/Disclosure";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { testimonialsHeading } from "@/data/home";
import { testimonials } from "@/data/testimonials";
import { ui } from "@/data/ui";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { LOCALES, href, localize } from "@/i18n";
import { getProduct, getProducts } from "@/lib/catalog";
import { pageMeta, seoTitle } from "@/lib/seo";
import { breadcrumbLd, jsonLdHtml } from "@/lib/jsonld";
import { preloadAllFonts } from "@/lib/fonts";

export async function generateStaticParams() {
  const products = await getProducts();
  // mỗi ngôn ngữ dùng đường dẫn riêng (urlSlug.vi / urlSlug.en)
  return LOCALES.flatMap((lang) => products.map((p) => ({ lang, slug: p.urlSlug[lang] })));
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const raw = await getProduct(slug);
  if (!raw) return { title: localize(siteConfig.notFoundTitle, lang) };
  const p = localize(raw, lang);
  return pageMeta({
    lang,
    path: { vi: `/san-pham/${raw.urlSlug.vi}`, en: `/san-pham/${raw.urlSlug.en}` },
    // "Tên – khẩu hiệu | Mayqueen Slim", gọn trong ~65 ký tự, không lặp thương hiệu
    title: seoTitle(p.name, p.tagline),
    description: p.short || p.tagline || p.name,
    image: { url: p.images[0], width: 2000, height: 2000 },
    imageAlt: p.name,
  });
}

// Nội dung phụ thuộc URL (đọc params) — đặt trong <Suspense> ở trang bên dưới
async function ProductContent({ params }) {
  const { lang, slug } = await params;
  const [raw, products] = await Promise.all([getProduct(slug), getProducts()]);
  if (!raw) notFound();

  const site = localize(siteConfig, lang);
  const p = localize(raw, lang);
  const L = localize({ ui, testimonialsHeading, testimonials, products }, lang);
  const labels = { ...L.ui, ...L.ui.product };
  const related = L.products.filter((x) => x.slug !== raw.slug);
  const reviews = L.testimonials.filter((r) => p.category === "combo" || !/combo/i.test(r.product));

  const pageUrl = site.url + href(lang, `/san-pham/${p.urlSlug}`);
  // Chính sách đổi trả (data/policies.js): CHỈ đổi mới (không hoàn tiền) trong 07 ngày khi hàng lỗi / giao sai /
  // cận date, Mayqueen chịu phí 2 chiều; KHÔNG nhận đổi trả khi khách đổi ý → khai báo đúng như vậy
  // (KHÔNG dùng returnFees: FreeReturn — Google hiểu là "trả miễn phí mọi lý do", sai với chính sách thật)
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "VN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    refundType: "https://schema.org/ExchangeRefund",
    itemDefectReturnFees: "https://schema.org/FreeReturn",
    merchantReturnLink:
      site.url + href(lang, `/chinh-sach/${lang === "en" ? "returns" : "doi-tra"}`),
  };
  // Giao hàng (data/policies.js): toàn quốc, 1–5 ngày; phí 30.000₫, miễn phí từ 500.000₫
  const shipping = (price) => ({
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "VN" },
    shippingRate: {
      "@type": "MonetaryAmount",
      value: price >= siteConfig.freeShipThreshold ? 0 : siteConfig.shippingFee,
      currency: "VND",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
    },
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    url: pageUrl,
    sku: raw.slug,
    // ảnh là URL tuyệt đối (Cloudinary) hoặc đường dẫn tương đối (/images/…) → new URL xử lý đúng cả hai
    image: p.images.map((i) => new URL(i, site.url).href),
    description: p.short || p.tagline,
    brand: { "@type": "Brand", name: site.name },
    category: p.ritual || undefined,
    offers: p.options.map((o) => ({
      "@type": "Offer",
      name: o.label,
      sku: `${raw.slug}-${o.id}`,
      url: pageUrl,
      price: o.price,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.name },
      shippingDetails: shipping(o.price),
      hasMerchantReturnPolicy: returnPolicy,
    })),
  };
  const crumbs = breadcrumbLd([
    { name: L.ui.home, url: site.url + href(lang, "/") },
    { name: lang === "en" ? "Shop" : "Cửa hàng", url: site.url + href(lang, "/san-pham") },
    { name: p.name, url: pageUrl },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(crumbs)} />
      {/* reveal-now: ảnh + tên sản phẩm (đầu trang) hiện bằng CSS ngay, không chờ JavaScript (xem globals.css) */}
      <section className="reveal-now bg-pearl pt-8 pb-16 lg:pt-12 lg:pb-24">
        <Container wide>
          <PageHeroCrumbs lang={lang} labels={L.ui} name={p.name} />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="reveal lg:sticky lg:top-28 lg:self-start" data-reveal="rise">
              <ProductGallery images={p.images} name={p.name} badge={p.badge} />
            </div>

            <div>
              {/* Trường nào trống trong Admin thì ẩn (không để dấu - hay khoảng trống thừa) */}
              {(p.ritual || p.spec) && (
                <p className="reveal eyebrow flex items-center gap-2">
                  <Leaf className="size-3.5" aria-hidden="true" />{" "}
                  {[p.ritual, p.spec].filter(Boolean).join(" - ")}
                </p>
              )}
              <h1 className="reveal h-lux mt-4 text-[32px] sm:text-[40px]">{p.name}</h1>
              {p.tagline && (
                <p className="reveal text-sage-700 mt-5 font-serif text-xl italic">{p.tagline}</p>
              )}
              {p.short && <p className="reveal text-ink-soft mt-3 leading-relaxed">{p.short}</p>}

              {p.benefits.length > 0 && (
                <ul className="reveal mt-6 grid gap-2.5 sm:grid-cols-2">
                  {p.benefits.map((b) => (
                    <li key={b} className="text-ink flex gap-2 text-sm">
                      <CheckCircle2
                        className="text-sage-600 mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />{" "}
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="reveal mt-8">
                <ProductPurchase product={p} lang={lang} labels={labels} />
              </div>

              {/* Câu khuyến cáo bắt buộc cho thực phẩm bảo vệ sức khỏe (NĐ 15/2018 Đ.27, NĐ 342/2025 Đ.5): đặt ngay
                  dưới giá / nút mua, chữ đứng, màu tương phản rõ với nền. Yodetox Extra (nhóm "detox") là thực phẩm
                  bổ sung, không phải TPBVSK → không gắn câu này; sản phẩm / combo khác có Mayqueen Slim → có. */}
              {raw.category !== "detox" && (
                <p className="reveal border-sage-200 bg-sage-50 text-ink mt-5 flex gap-2.5 rounded-2xl border px-4 py-3 text-[13.5px] leading-relaxed">
                  <Info className="text-sage-700 mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{labels.disclaimer}</span>
                </p>
              )}

              <div className="reveal divide-forest/10 border-forest/10 mt-10 divide-y border-y">
                {[
                  p.description && [labels.description, <p key="d">{p.description}</p>],
                  (p.ingredients.length > 0 || p.excipients) && [
                    labels.ingredients,
                    <div key="i">
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {p.ingredients.map((ing) => (
                          <li key={ing.name} className="bg-sage-50 rounded-2xl p-4">
                            <p className="text-forest font-semibold">{ing.name}</p>
                            <p className="text-ink-muted mt-1 text-xs">{ing.note}</p>
                          </li>
                        ))}
                      </ul>
                      {p.excipients && (
                        <p className="text-ink-muted mt-4 text-xs">{p.excipients}</p>
                      )}
                    </div>,
                  ],
                  p.usage.length > 0 && [
                    labels.usage,
                    <ul key="u" className="list-disc space-y-1.5 pl-5">
                      {[p.usage].flat().map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>,
                  ],
                  p.spec && [labels.spec, <p key="s">{p.spec}</p>],
                ]
                  .filter(Boolean)
                  .map(([title, body], i) => (
                    <Disclosure
                      key={title}
                      defaultOpen={i === 0}
                      // padding đặt ở nút (không ở khung) → vùng chạm ≥ 44px trên điện thoại
                      buttonClassName="text-forest py-5 font-serif text-xl"
                      panelClassName="text-ink-soft pt-1 pb-5 text-sm leading-relaxed"
                      summary={title}
                      icon={
                        <span
                          key="icon" // React 19: JSX truyền qua prop từ Server Component → cần key
                          className="text-sage-600 text-2xl leading-none transition-transform duration-500 group-data-[open=true]:rotate-45"
                        >
                          +
                        </span>
                      }
                    >
                      {body}
                    </Disclosure>
                  ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {site.showTestimonials && (
        <TestimonialSlider data={L.testimonialsHeading} reviews={reviews} />
      )}

      <section className="bg-pearl section-y">
        <Container wide>
          <SectionHeading title={labels.related} />
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2">
            {related.map((r, i) => (
              <div key={r.slug} className="reveal" style={{ "--reveal-delay": `${i * 120}ms` }}>
                <ProductCard
                  product={r}
                  lang={lang}
                  labels={labels}
                  sizes="(min-width: 1024px) 480px, (min-width: 640px) 45vw, 90vw"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

// Breadcrumb gọn cho trang sản phẩm (không cần banner lớn)
function PageHeroCrumbs({ lang, labels, name }) {
  return (
    <nav aria-label="Breadcrumb" className="reveal text-ink-muted text-xs">
      <Link href={href(lang, "/")} className="hover:text-forest">
        {labels.home}
      </Link>
      <span className="mx-2">/</span>
      <Link href={href(lang, "/san-pham")} className="hover:text-forest">
        {lang === "vi" ? "Cửa hàng" : "Shop"}
      </Link>
      <span className="mx-2">/</span>
      <span className="text-forest">{name}</span>
    </nav>
  );
}

/**
 * Trang không await params ở cấp trên cùng: khung trang (App Shell) dùng chung cho mọi slug,
 * phần đọc params nằm trong <Suspense> → chuyển trang tức thì (Next.js 16 partial prefetching).
 */
export default function ProductPage({ params }) {
  preloadAllFonts(); // tên / slogan sản phẩm dùng serif nghiêng + sans 500/700 ngay màn đầu
  return (
    <Suspense fallback={<PageSkeleton variant="product" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}
