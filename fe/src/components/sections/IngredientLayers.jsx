"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import CircleLink from "@/components/ui/CircleLink";
import LuxTitle from "@/components/ui/LuxTitle";
import { href } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Khối 3 — Thành phần (bố cục khối "8 lớp kiến tạo - Công nghệ phía sau" của Kobler):
 * - Cột trái: tiêu đề, tab Mayqueen Slim | Yodetox Extra, sơ đồ lớp: mỗi tấm 3D mảnh nằm ngang hàng
 *   đúng dòng thành phần của nó (nối nét đứt). Khi sơ đồ lọt vào màn hình, các tấm TRƯỢT từ chồng
 *   xếp ra vị trí theo thứ tự (CSS transition → mượt, không giật); cuộn ngược lên thì thu lại thành chồng,
 *   đổi tab thì chạy lại. Tối đa 5 thành phần hàm lượng cao nhất + 1 dòng "Và N thành phần khác".
 * - Cột phải: "Quy trình phía sau mỗi sản phẩm" — thẻ ảnh + mũi tên; chiều cao 2 cột tương đương.
 * - Mobile: thành phần dạng lưới 2 cột, thẻ quy trình vuốt ngang.
 */
const PLATE = 96; // cạnh tấm vuông trước khi xoay → hình thoi rộng ~136px, cao ~68px
const PLATE_W = Math.round(PLATE * Math.SQRT2);
const PLATE_H = Math.round(PLATE_W / 2);
const ROW = 50; // chiều cao mỗi dòng thành phần (2 dòng chữ: tên + hàm lượng) = khoảng cách giữa các tấm khi tách
const STACKED = 5; // khoảng cách giữa các tấm khi còn xếp chồng
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Sơ đồ tấm + danh sách — key theo tab để đổi tab là chạy lại hiệu ứng. */
function LayerDiagram({ tab, lang }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const n = tab.layers.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        // vào màn hình → tách lớp; cuộn ngược lên (khối rơi xuống dưới màn hình) → xếp chồng lại.
        // Đã cuộn qua phía trên thì giữ nguyên trạng thái tách.
        if (e.isIntersecting) setShown(true);
        else if (e.boundingClientRect.top > 0) setShown(false);
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative mt-9 flex" style={{ height: n * ROW }}>
      {/* chồng tấm */}
      <div aria-hidden="true" className="relative shrink-0" style={{ width: PLATE_W }}>
        {tab.layers.map((layer, i) => {
          const final = i * ROW + ROW / 2 - PLATE_H / 2;
          const stacked = ROW / 2 - PLATE_H / 2 + i * STACKED;
          return (
            <div
              key={i}
              className="absolute top-0 left-0"
              style={{
                width: PLATE_W,
                height: PLATE_H,
                zIndex: n - i,
                opacity: layer.more ? 0.55 : 1,
                transform: `translate3d(0, ${shown ? final : stacked}px, 0)`,
                // tách: lớp trên đi trước; thu lại: lớp dưới về trước
                transition: `transform ${shown ? 1.1 : 0.8}s ${EASE} ${(shown ? i : n - 1 - i) * 70}ms`,
              }}
            >
              <div
                className="absolute"
                style={{
                  width: PLATE,
                  height: PLATE,
                  left: (PLATE_W - PLATE) / 2,
                  top: (PLATE_H - PLATE) / 2,
                  transform: "rotateX(60deg) rotateZ(-45deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[6px]"
                  style={{ transform: "translateZ(-4px)", background: "#8ea47a" }}
                />
                {/* mọi lớp đều in ảnh sản phẩm (đồng bộ); lớp có image riêng thì dùng ảnh đó */}
                <div className="absolute inset-0 overflow-hidden rounded-[6px] border border-white/80 shadow-[0_14px_18px_-12px_rgba(30,58,40,.45)]">
                  <Image
                    src={layer.image ?? tab.image}
                    alt=""
                    fill
                    sizes="110px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* danh sách: mỗi dòng cao ROW, ngang hàng tâm tấm */}
      <ol className="min-w-0 flex-1 pl-10 xl:pl-16">
        {tab.layers.map((layer, i) => (
          <li
            key={i}
            className="relative flex items-center gap-3.5"
            style={{
              height: ROW,
              opacity: shown ? 1 : 0,
              transform: `translate3d(${shown ? 0 : 14}px, 0, 0)`,
              transition: shown
                ? `opacity .7s ease ${200 + i * 70}ms, transform .9s ${EASE} ${200 + i * 70}ms`
                : `opacity .35s ease, transform .5s ${EASE}`,
            }}
          >
            <span
              aria-hidden="true"
              className="border-forest/25 absolute top-1/2 right-full mr-2 w-6 border-t border-dashed xl:w-10"
            />
            <LayerBadge layer={layer} i={i} />
            {layer.more ? (
              <Link
                href={href(lang, `/san-pham/${layer.urlSlug}`)}
                title={layer.benefit}
                className="group/more min-w-0 flex-1"
              >
                <LayerText layer={layer} more />
              </Link>
            ) : (
              <LayerText layer={layer} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 2 dòng: tên thành phần (in hoa) + dạng chất / hàm lượng (chữ nhỏ, quá dài thì "...") */
function LayerText({ layer, more }) {
  return (
    <span className="block min-w-0 flex-1 leading-tight">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-forest truncate text-[13px] font-semibold tracking-[0.02em] uppercase xl:text-[13.5px] xl:tracking-[0.04em]",
            more && "group-hover/more:text-sage-700 transition-colors",
          )}
        >
          {layer.name}
        </span>
        {more && <ArrowUpRight className="text-sage-600 size-3.5 shrink-0" aria-hidden="true" />}
      </span>
      {layer.benefit && (
        <span className="text-ink-muted mt-1 block truncate text-[12.5px]">{layer.benefit}</span>
      )}
    </span>
  );
}

/** Số thứ tự; dòng "thành phần khác" dùng dấu + */
function LayerBadge({ layer, i, className }) {
  return layer.more ? (
    <span
      className={cn(
        "border-forest/40 text-forest grid size-6 shrink-0 place-items-center rounded-full border border-dashed",
        className,
      )}
    >
      <Plus className="size-3" aria-hidden="true" />
    </span>
  ) : (
    <span
      className={cn(
        "bg-forest grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white",
        className,
      )}
    >
      {i + 1}
    </span>
  );
}

export default function IngredientLayers({ lang, data, tabs }) {
  const [tabId, setTabId] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === tabId);

  return (
    <section id="thanh-phan" className="bg-pearl section-y relative scroll-mt-16 overflow-hidden">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
        {/* ---------- Cột trái: các lớp thành phần ---------- */}
        <div className="min-w-0 lg:pr-8 xl:pr-16">
          <LuxTitle title={data.title} accent={data.accent} size="sm" />

          {/* Tab chọn sản phẩm. Điện thoại: 2 cột chia đều trong khung bo tròn, chữ căn giữa và được xuống dòng
              (liều dùng tiếng Anh dài — "2 sachets per serving, 2–3 times a day" — từng tràn khỏi màn 375px).
              Từ tablet: dạng viên thuốc 1 hàng như cũ. */}
          <div
            role="tablist"
            className="reveal border-forest/10 bg-linen mt-7 grid w-full grid-cols-2 gap-1 rounded-[1.75rem] border p-1 sm:inline-flex sm:w-auto sm:max-w-full sm:rounded-full"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={t.id === tabId}
                onClick={() => setTabId(t.id)}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center rounded-3xl px-3 py-2.5 text-center leading-tight transition-colors sm:items-start sm:rounded-full sm:px-6 sm:py-2 sm:text-left",
                  t.id === tabId ? "bg-forest text-white" : "text-ink-soft hover:text-forest",
                )}
              >
                <span className="text-[12px] font-semibold tracking-[0.08em] text-balance uppercase sm:whitespace-nowrap">
                  {t.label}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[11px] leading-snug text-balance sm:mt-0.5 sm:text-[11.5px] sm:leading-tight sm:whitespace-nowrap",
                    t.id === tabId ? "text-white/70" : "text-ink-muted",
                  )}
                >
                  {t.time}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: sơ đồ tấm + danh sách */}
          <div className="hidden lg:block">
            <LayerDiagram key={tabId} tab={tab} lang={lang} />
          </div>

          {/* Mobile / tablet: lưới 2 cột, không cuộn ngang */}
          <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
            {tab.layers.map((layer, i) => {
              const body = (
                <>
                  <LayerBadge layer={layer} i={i} className="size-7" />
                  {/* tên dài ("Chiết xuất trà xanh") trong ô hẹp: chỉ xuống dòng ở khoảng trắng, không bẻ giữa chữ */}
                  <p className="text-forest mt-3 text-[12.5px] leading-snug font-semibold break-normal [overflow-wrap:normal] uppercase sm:text-[13px]">
                    {layer.name}
                  </p>
                  <p
                    className={cn(
                      "text-ink-muted mt-0.5 text-[13px]",
                      layer.more && "line-clamp-2",
                    )}
                  >
                    {layer.benefit}
                  </p>
                </>
              );
              return (
                <li
                  key={`${tabId}-m-${i}`}
                  className={cn(
                    "reveal bg-linen rounded-xl border",
                    layer.more ? "border-forest/25 border-dashed" : "border-forest/10 p-4",
                  )}
                  style={{ "--reveal-delay": `${(i % 2) * 80}ms` }}
                >
                  {layer.more ? (
                    <Link href={href(lang, `/san-pham/${layer.urlSlug}`)} className="block p-4">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ---------- Cột phải: quy trình phía sau sản phẩm ---------- */}
        <div className="border-forest/10 flex min-w-0 flex-col lg:border-l lg:pl-12 xl:pl-16">
          <LuxTitle title={data.process.title} accent={data.process.accent} size="sm" />

          {/* 3 thẻ: điện thoại xếp dọc (thẻ ngang, không vuốt); từ tablet trở lên lưới 3 cột.
              Laptop+: thẻ giãn cao lấp đầy cột (lg:flex-1) → đáy cột phải bằng đáy cột trái, nút "Xem chứng
              nhận" nằm giữa ngay dưới thẻ, ngang hàng dòng "N thành phần khác" — 2 cột cân nhau. */}
          <ul className="mt-9 grid gap-4 sm:grid-cols-3 lg:min-h-[300px] lg:flex-1">
            {data.process.cards.map((c, i) => (
              <li
                key={c.title}
                className="reveal group relative aspect-[5/4] overflow-hidden rounded-2xl sm:aspect-[3/4] lg:aspect-auto lg:h-full"
                style={{ "--reveal-delay": `${i * 90}ms` }}
              >
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 32vw, 92vw"
                  className="object-cover object-[center_30%] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05] sm:object-top"
                />
                {/* lớp tối phía dưới phủ cao hơn → số + chữ luôn rõ trên mọi ảnh (kể cả ảnh nền sáng) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a11]/95 via-[#0d1a11]/55 via-45% to-transparent to-75%" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-4 xl:p-5">
                  {/* Cùng nhịp giữa 3 thẻ: số → tiêu đề (CANH TRÊN, luôn giữ chỗ 2 dòng) → mô tả (giữ chỗ 4 dòng)
                      → số / dòng đầu tiêu đề / dòng đầu mô tả của 3 thẻ thẳng hàng nhau, tiêu đề 1 dòng hay 2
                      dòng đều không làm lệch (trước đây tiêu đề dồn đáy nên số "trôi" khác nhau). */}
                  <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.2em] text-white/85">
                    0{i + 1}
                    <span className="h-px w-6 bg-white/50" aria-hidden="true" />
                  </span>
                  <p className="mt-2 text-[13px] leading-snug font-semibold tracking-[0.04em] text-balance uppercase sm:min-h-[2lh] xl:text-[14px]">
                    {c.title}
                  </p>
                  {/* màn 1024–1279px thẻ hẹp (~160px) → mô tả dài tới 7 dòng: giữ chỗ 7 dòng để 3 thẻ vẫn thẳng */}
                  <p className="mt-1.5 text-[13.5px] leading-snug text-white/80 sm:min-h-[4lh] lg:min-h-[7lh] xl:min-h-[4lh]">
                    {c.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* nút căn giữa dưới 3 thẻ, sát thẻ (không còn khoảng trống lơ lửng) */}
          <div className="flex justify-center pt-8">
            <CircleLink href={href(lang, "/#chung-nhan")}>{data.process.cta}</CircleLink>
          </div>
        </div>
      </div>
    </section>
  );
}
