import ArticleCard from "@/components/blog/ArticleCard";
import ArticleList from "@/components/blog/ArticleList";
import PageHero from "@/components/layout/PageHero";
import SocialFeed from "@/components/sections/SocialFeed";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { backgrounds } from "@/data/images";
import { socialFeed as socialHeading } from "@/data/home";
import { ui } from "@/data/ui";
import { href, localize, t } from "@/i18n";
import { breadcrumbLd, jsonLdHtml } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";
import { getArticleCategories, getArticles } from "@/lib/catalog";

const copy = {
  seoTitle: t(
    "Sống đẹp – Detox, Eat Clean & bí quyết giữ dáng",
    "Journal – Detox, clean eating & staying in shape",
  ),
  eyebrow: t("Cẩm nang sống đẹp", "Lifestyle journal"),
  title: t("Sống đẹp", "Live well"),
  accent: t("cùng Mayqueen", "with Mayqueen"),
  text: t(
    "Công thức detox, thực đơn Eat Clean và bí quyết giữ dáng — cẩm nang nhỏ cho một lối sống xanh, khỏe và thật tự tin.",
    "Detox recipes, Eat Clean menus and body tips — a little guide to a greener, healthier and more confident life.",
  ),
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const c = localize(copy, lang);
  return pageMeta({
    lang,
    path: { vi: "/song-dep", en: "/song-dep" },
    title: c.seoTitle,
    description: c.text,
  });
}

export default async function JournalPage({ params }) {
  const { lang } = await params;
  const site = localize(siteConfig, lang);
  const [articles, articleCategories] = await Promise.all([getArticles(), getArticleCategories()]);
  const L = localize({ copy, articles, articleCategories, ui, socialHeading }, lang);
  const [featured, ...rest] = L.articles;
  const categoryLabels = Object.fromEntries(L.articleCategories.map((c) => [c.id, c.label]));

  // Breadcrumb cho Google (khớp breadcrumb hiển thị): "Mayqueen Slim › /song-dep"
  const crumbsLd = breadcrumbLd([
    { name: L.ui.home, url: site.url + href(lang, "/") },
    { name: lang === "en" ? "Journal" : "Sống đẹp", url: site.url + href(lang, "/song-dep") },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(crumbsLd)} />
      <PageHero
        image={backgrounds.airyLeaves}
        crumbs={[
          { label: L.ui.home, href: href(lang, "/") },
          { label: `${L.copy.title} ${L.copy.accent}` },
        ]}
        eyebrow={L.copy.eyebrow}
        title={L.copy.title}
        accent={L.copy.accent}
        text={L.copy.text}
      />
      <section className="bg-pearl pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
        <Container wide>
          {/* tiêu đề ẩn (trình đọc màn hình / SEO): thẻ bài nổi bật là h3 → cần h2 trước nó (h1 → h2 → h3) */}
          <h2 className="sr-only">{lang === "en" ? "Featured article" : "Bài viết nổi bật"}</h2>
          {featured && (
            <div className="reveal" data-reveal="scale">
              <ArticleCard
                article={featured}
                lang={lang}
                categoryLabel={categoryLabels[featured.category]}
                labels={L.ui}
                variant="feature"
                className="lg:h-[min(520px,calc(100svh-200px))]"
              />
            </div>
          )}
          <div className="mt-16">
            <ArticleList
              lang={lang}
              articles={L.articles}
              featuredSlug={featured?.slug}
              categories={L.articleCategories}
              labels={L.ui}
            />
          </div>
        </Container>
      </section>
      <SocialFeed data={L.socialHeading} site={site} />
    </>
  );
}
