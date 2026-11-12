import { Suspense } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ArticleCard from "@/components/blog/ArticleCard";
import Parallax from "@/components/fx/Parallax";
import SplitText from "@/components/fx/SplitText";
import Button from "@/components/ui/Button";
import Price from "@/components/ui/Price";
import Container from "@/components/ui/Container";
import { FacebookIcon } from "@/components/ui/BrandIcons";
import { siteConfig } from "@/config/site";
import { ui } from "@/data/ui";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { LOCALES, href, localize, t } from "@/i18n";
import { getArticle, getArticleCategories, getArticles, getProducts } from "@/lib/catalog";
import { cn, formatDate } from "@/lib/utils";
import { pageMeta, seoTitle } from "@/lib/seo";
import { breadcrumbLd, jsonLdHtml } from "@/lib/jsonld";

const copy = {
  back: t("Tất cả bài viết", "All articles"),
  consultLine: t("Nhận lộ trình giữ dáng riêng cho bạn", "Get a personalised plan"),
  shopTitle: t("Gợi ý cho bạn", "Recommended for you"),
  more: t("Đọc thêm", "Keep reading"),
};

// Sản phẩm gợi ý theo chuyên mục bài viết → danh mục sản phẩm (lấy sản phẩm đầu tiên của danh mục)
const PRODUCT_CATEGORY_BY_ARTICLE = {
  detox: "detox",
  "eat-clean": "slim",
  "giu-dang": "combo",
};

export async function generateStaticParams() {
  const articles = await getArticles();
  // mỗi ngôn ngữ dùng đường dẫn riêng (urlSlug.vi / urlSlug.en)
  return LOCALES.flatMap((lang) => articles.map((a) => ({ lang, slug: a.urlSlug[lang] })));
}

/** Mô tả bài: tóm tắt admin nhập; để trống → lấy ~155 ký tự đầu của nội dung (cho Google / ảnh chia sẻ) */
function summaryOf(a) {
  if (a.excerpt) return a.excerpt;
  const text = String(a.body ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 155 ? `${text.slice(0, 154).replace(/\s+\S*$/, "")}…` : text;
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const raw = await getArticle(slug);
  if (!raw) return { title: localize(siteConfig.notFoundTitle, lang) };
  const a = localize(raw, lang);
  const meta = pageMeta({
    lang,
    path: { vi: `/song-dep/${raw.urlSlug.vi}`, en: `/song-dep/${raw.urlSlug.en}` },
    title: seoTitle(a.title), // tiêu đề dài → bỏ hậu tố thương hiệu cho khỏi bị cắt
    description: summaryOf(a),
    image: { url: a.cover },
    imageAlt: a.title,
    type: "article",
    extra: { publishedTime: a.publishedAt, modifiedTime: a.updatedAt },
  });
  // bản tiếng Anh chưa dịch (đang hiện tạm nội dung tiếng Việt) → không cho Google lập chỉ mục bản EN
  return lang === "en" && !raw.hasEn ? { ...meta, robots: { index: false, follow: true } } : meta;
}

// Nội dung phụ thuộc URL (đọc params) — đặt trong <Suspense> ở trang bên dưới
async function ArticleContent({ params }) {
  const { lang, slug } = await params;
  const [raw, articles, products, articleCategories] = await Promise.all([
    getArticle(slug),
    getArticles(),
    getProducts(),
    getArticleCategories(),
  ]);
  if (!raw) notFound();

  const site = localize(siteConfig, lang);
  const a = localize(raw, lang);
  const L = localize({ copy, ui, articleCategories }, lang);
  const categoryLabels = Object.fromEntries(L.articleCategories.map((c) => [c.id, c.label]));
  const rawProduct =
    products.find((p) => p.category === PRODUCT_CATEGORY_BY_ARTICLE[a.category]) ?? products[0];
  const product = rawProduct && localize(rawProduct, lang);
  const more = localize(articles.filter((x) => x.slug !== raw.slug).slice(0, 2), lang);

  // Dữ liệu có cấu trúc cho Google: bài viết (BlogPosting) — tiêu đề, ảnh, ngày đăng / sửa, tác giả, đơn vị xuất bản
  const url = site.url + href(lang, `/song-dep/${raw.urlSlug[lang]}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: summaryOf(a),
    image: [new URL(a.cover, site.url).href],
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    inLanguage: lang === "vi" ? "vi-VN" : "en-US",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: categoryLabels[a.category],
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${site.url}/images/brand/logo-bot.png` },
    },
  };
  const crumbs = breadcrumbLd([
    { name: L.ui.home, url: site.url + href(lang, "/") },
    { name: lang === "en" ? "Journal" : "Sống đẹp", url: site.url + href(lang, "/song-dep") },
    { name: a.title, url },
  ]);

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(crumbs)} />
      {/* Banner bài viết: ảnh ngang nền tối (cùng ảnh thẻ nổi bật), cụm chữ căn GIỮA theo chiều cao như các banner khác */}
      <header className="reveal-now bg-moss text-pearl relative flex h-[clamp(460px,72svh,620px)] overflow-hidden">
        <Parallax speed={0.06} className="media-cap absolute inset-x-0 -inset-y-[6%]">
          <Image
            src={a.banner ?? a.cover}
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-right"
          />
        </Parallax>
        <div className="from-moss via-moss/60 absolute inset-0 hidden bg-gradient-to-r via-40% to-transparent sm:block" />
        <div className="bg-moss/65 absolute inset-0 sm:hidden" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/25" />

        <Container wide className="relative flex w-full flex-col pt-24 pb-10 lg:pt-28 lg:pb-12">
          {/* desktop: chữ không lấn sang ảnh sản phẩm ở nửa phải banner */}
          <div className="my-auto max-w-4xl py-6 lg:max-w-[min(50rem,52%)]">
            <Link
              href={href(lang, "/song-dep")}
              className="reveal text-pearl/85 hover:text-sage-300 mb-7 inline-flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> {L.copy.back}
            </Link>
            <p className="reveal text-sage-300 text-[11px] font-semibold tracking-[0.3em] uppercase">
              {categoryLabels[a.category]}
            </p>
            <SplitText
              as="h1"
              text={a.title}
              step={40}
              /* tiêu đề càng dài chữ càng nhỏ một chút → 2–3 dòng cân đối, không dòng nào quá dài */
              className={cn(
                "h-lux text-pearl mt-4 text-balance",
                a.title.length > 60
                  ? "text-[26px] sm:text-[34px] lg:text-[40px]"
                  : a.title.length > 40
                    ? "text-[27px] sm:text-[36px] lg:text-[43px]"
                    : "text-[28px] sm:text-[38px] lg:text-[46px]",
              )}
            />
            <p className="reveal text-pearl/75 mt-6 text-sm">
              <time dateTime={a.date}>{formatDate(a.date, lang)}</time>
            </p>
          </div>
        </Container>
      </header>

      {/* Nội dung rộng hơn; cột phải gọn (luôn thấp hơn màn hình) nên sticky suốt chiều dài bài */}
      <Container
        wide
        className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:py-20 xl:gap-24"
      >
        <div className="text-ink-soft text-[17px] leading-[1.8]">
          {a.excerpt && (
            <p className="reveal text-forest font-serif text-2xl leading-snug">{a.excerpt}</p>
          )}
          {/* Nội dung soạn bằng trình soạn thảo trong Admin — HTML đã được backend lọc an toàn */}
          <div className="rich-content mt-8" dangerouslySetInnerHTML={{ __html: a.body }} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5">
            {product && (
              <div
                className="reveal border-forest/10 hover:border-sage-300 relative cursor-pointer rounded-2xl border p-5 transition-colors"
                style={{ "--reveal-delay": "120ms" }}
              >
                <p className="eyebrow">{L.copy.shopTitle}</p>
                <Link
                  href={href(lang, `/san-pham/${product.urlSlug}`)}
                  className="group mt-4 flex gap-4 after:absolute after:inset-0 after:rounded-2xl"
                >
                  <div className="bg-sand relative size-24 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="96px"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sage-600 text-[10.5px] font-semibold tracking-[0.2em] uppercase">
                      {product.ritual}
                    </p>
                    <p className="text-forest group-hover:text-sage-600 mt-1 font-serif text-lg leading-tight">
                      {product.name}
                    </p>
                    <Price
                      price={product.options[0].price}
                      compareAt={product.options[0].compareAt}
                      lang={lang}
                      className="mt-1 text-sm"
                    />
                  </div>
                </Link>
                <p className="text-ink-soft mt-4 text-[13px] leading-relaxed">{product.short}</p>
                <Button
                  href={href(lang, `/san-pham/${product.urlSlug}`)}
                  size="sm"
                  arrow
                  className="relative z-10 mt-4 w-full"
                >
                  {L.ui.viewProduct}
                </Button>
              </div>
            )}

            <button
              type="button"
              data-consult=""
              style={{ "--reveal-delay": "240ms" }}
              className="reveal group border-forest/10 shadow-card hover:border-sage-300 flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left transition-colors"
            >
              <span className="min-w-0 flex-1">
                <span className="text-sage-700 block text-[11px] font-semibold tracking-[0.2em] uppercase">
                  {L.ui.consult}
                </span>
                <span className="text-forest mt-1 block font-serif text-lg leading-snug text-balance">
                  {L.copy.consultLine}
                </span>
              </span>
              {/* mũi tên trong nút tròn bên phải — không rớt dòng theo chữ */}
              <span className="bg-forest text-pearl group-hover:bg-sage-700 grid size-10 shrink-0 place-items-center rounded-full transition-colors">
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </aside>
      </Container>

      <section className="border-forest/10 bg-linen section-y border-t">
        <Container wide>
          <h2 className="reveal h-display text-3xl sm:text-4xl">{L.copy.more}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {more.map((m) => (
              <li key={m.slug} className="reveal">
                <ArticleCard
                  article={m}
                  lang={lang}
                  categoryLabel={categoryLabels[m.category]}
                  labels={L.ui}
                />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </article>
  );
}

/**
 * Trang không await params ở cấp trên cùng: khung trang (App Shell) dùng chung cho mọi slug,
 * phần đọc params nằm trong <Suspense> → chuyển trang tức thì (Next.js 16 partial prefetching).
 */
export default function ArticlePage({ params }) {
  return (
    <Suspense fallback={<PageSkeleton variant="article" />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}
