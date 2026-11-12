import Image from "@/components/ui/Img";
import Link from "next/link";
import CircleLink from "@/components/ui/CircleLink";
import LuxTitle from "@/components/ui/LuxTitle";
import { href } from "@/i18n";
import { formatDate } from "@/lib/utils";

/**
 * "Sống đẹp cùng Mayqueen" — khối nhỏ giữa Cảm nhận và Tư vấn: 3 bài mới nhất dạng thẻ ảnh kiểu Kobler
 * (ảnh trên, chuyên mục + tiêu đề IN HOA, ngày/thời gian đọc).
 */
export default function JournalTeaser({ lang, data, articles, categoryLabels }) {
  return (
    <section className="bg-pearl section-y">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <LuxTitle
          eyebrow={data.eyebrow}
          title={data.title}
          accent={data.accent}
          size="sm"
          aside={<CircleLink href={href(lang, "/song-dep")}>{data.cta}</CircleLink>}
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.slice(0, 3).map((a, i) => (
            <li key={a.slug} className="reveal" style={{ "--reveal-delay": `${i * 110}ms` }}>
              <Link href={href(lang, `/song-dep/${a.urlSlug}`)} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={a.cover}
                    alt={a.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                </div>
                <p className="text-sage-600 mt-5 text-[11px] font-semibold tracking-[0.2em] uppercase">
                  {categoryLabels[a.category]}
                </p>
                <h3 className="text-forest group-hover:text-sage-600 mt-2 line-clamp-2 text-[17px] leading-snug font-bold tracking-[0.02em] uppercase transition-colors">
                  {a.title}
                </h3>
                <p className="text-ink-muted mt-2 text-xs">{formatDate(a.date, lang)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
