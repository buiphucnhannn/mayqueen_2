import { Fragment, Suspense } from "react";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPolicy, policies } from "@/data/policies";
import { LOCALES, href, localize } from "@/i18n";
import { breadcrumbLd, jsonLdHtml } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";

// Mỗi ngôn ngữ dùng slug riêng: /chinh-sach/doi-tra - /en/policies/returns
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => policies.map((p) => ({ lang, slug: p.urlSlug[lang] })));
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const p = getPolicy(slug);
  if (!p) return { title: localize(siteConfig.notFoundTitle, lang) };
  return pageMeta({
    lang,
    path: { vi: `/chinh-sach/${p.urlSlug.vi}`, en: `/chinh-sach/${p.urlSlug.en}` },
    title: localize(p.seoTitle, lang),
    description: localize(p.hero.text, lang),
  });
}

/** "**chữ**" → in đậm (đúng chỗ in đậm trong tài liệu gốc) */
function Rich({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="text-forest font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Nội dung 1 chính sách — trình bày như tài liệu: tiêu đề mục đánh số, đoạn văn, gạch đầu dòng
// (nhãn in đậm đầu dòng). Banner, menu, cột phải nằm ở ../layout.js (giữ nguyên khi đổi chính sách).
async function PolicyContent({ params }) {
  const { lang, slug } = await params;
  const raw = getPolicy(slug);
  if (!raw) notFound();
  const p = localize(raw, lang);
  const base = siteConfig.url;
  const crumbs = breadcrumbLd([
    { name: lang === "en" ? "Home" : "Trang chủ", url: base + href(lang, "/") },
    { name: p.title, url: base + href(lang, `/chinh-sach/${p.urlSlug}`) },
  ]);

  return (
    // mờ dần vào mỗi khi đổi chính sách (key theo slug)
    <div key={slug} className="[animation:fadeIn_.45s_ease-out_both]">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(crumbs)} />
      <h2 className="text-forest font-serif text-[28px] leading-tight sm:text-[34px]">
        {p.heading}
      </h2>
      <span className="bg-sage-300 mt-4 block h-0.5 w-12 rounded-full" aria-hidden="true" />

      <div className="text-ink-soft mt-6 text-[16px] leading-[1.75] sm:text-[17px]">
        {p.intro && <p>{p.intro}</p>}

        {p.sections.map((s, i) => (
          <section key={i} className={p.intro || i > 0 ? "mt-9" : ""}>
            {s.title && (
              <h3 className="text-forest text-[18px] leading-snug font-semibold sm:text-[19px]">
                {s.title}
              </h3>
            )}
            {s.text && (
              <p className={s.title ? "mt-3" : ""}>
                <Rich text={s.text} />
              </p>
            )}
            {s.items && (
              <ul className={s.title || s.text ? "mt-3 space-y-2.5" : "space-y-2.5"}>
                {s.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      className="bg-sage-500 mt-[0.72em] size-1.5 shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      {it.label && (
                        <strong className="text-forest font-semibold">{it.label}: </strong>
                      )}
                      <Rich text={it.text} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** Đọc params trong <Suspense> → khung (layout) hiện ngay, chỉ phần chữ chờ (thường tức thì vì đã prefetch) */
export default function PolicyPage({ params }) {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <PolicyContent params={params} />
    </Suspense>
  );
}
