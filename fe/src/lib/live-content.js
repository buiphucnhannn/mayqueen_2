import { t } from "@/i18n";

/**
 * Nội dung trang chủ / Cửa hàng có nhắc tới SẢN PHẨM → lấy từ dữ liệu Admin (lib/catalog) thay vì ghi cứng,
 * để admin đổi tên, giá, mô tả, cách dùng, quy cách… thì trang chủ tự cập nhật theo.
 *
 * - Làm việc trên dữ liệu song ngữ { vi, en } — gọi TRƯỚC localize().
 * - Khớp sản phẩm theo slug (kể cả slug cũ admin đã đổi). Thiếu dữ liệu → giữ câu chữ mặc định trong data/home.js.
 * - Sản phẩm bị ẩn / xóa → slide banner của nó tự ẩn (không trỏ link vào trang 404).
 */

const bySlug = (products, slug) =>
  products.find((p) => p.slug === slug || p.oldSlugs?.includes(slug));

const fmtVnd = (n, lang) => `${n.toLocaleString(lang === "en" ? "en-US" : "vi-VN")}₫`;

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Liều dùng ngắn gọn từ "Cách dùng": ưu tiên dòng "Liều dùng: …" / "Dosage: …", rồi dòng có "mỗi ngày / a day",
 * cuối cùng là dòng đầu. "Liều dùng: 2 gói/lần, ngày 2–3 lần." → "2 gói/lần, ngày 2–3 lần"
 */
export function doseOf(p) {
  const usage = p?.usage ?? [];
  const line =
    usage.find((u) => /liều dùng|dosage/i.test(`${u.vi} ${u.en}`)) ??
    usage.find((u) => /mỗi ngày|\/ngày|a day|per day/i.test(`${u.vi} ${u.en}`)) ??
    usage[0];
  if (!line?.vi) return null;
  const clean = (s) =>
    cap(
      String(s)
        .replace(/^(liều dùng|dosage)\s*:\s*/i, "")
        .replace(/\.\s*$/, ""),
    );
  return t(clean(line.vi), clean(line.en || line.vi));
}

/** Số lượng trong "Quy cách": "1 lọ 30 viên" + /viên/ → 30; "1 hộp × 20 gói × 2 g/gói" + /gói/ → 20 */
function countIn(spec, unit) {
  const all = [...String(spec ?? "").matchAll(new RegExp(`(\\d+)\\s*${unit}(?!\\/)`, "gi"))];
  return all.length ? Number(all.at(-1)[1]) : null;
}

/** Mức tiết kiệm lớn nhất của các gói đang bán (giá gốc − giá bán) */
export function maxSaving(products) {
  const s = products.flatMap((p) =>
    p.options.map((o) => (o.compareAt ? o.compareAt - o.price : 0)),
  );
  return Math.max(0, ...s);
}

/** Số gói/combo đang giảm giá (có giá gốc gạch ngang) */
export const bundleCount = (products) =>
  products.reduce((n, p) => n + p.options.filter((o) => o.compareAt > o.price).length, 0);

/** Trang chủ: gắn dữ liệu sản phẩm thật vào các khối của data/home.js */
export function liveHome(home, products) {
  const mq = bySlug(products, "mayqueen-slim");
  const yd = bySlug(products, "yodetox-extra");

  // 1) Banner: dòng nhỏ = "Tên - Loại sản phẩm", mô tả = Mô tả ngắn, nút + link theo tên / đường dẫn hiện tại
  const slides = home.hero.slides
    .map((s) => {
      const p = bySlug(products, s.id);
      if (!p) return null; // sản phẩm đã ẩn / xóa → bỏ slide
      return {
        ...s,
        eyebrow: p.ritual?.vi
          ? t(`${p.name.vi} - ${p.ritual.vi}`, `${p.name.en} - ${p.ritual.en || p.ritual.vi}`)
          : s.eyebrow,
        text: p.short?.vi ? p.short : s.text,
        buy: t(`Khám phá ${p.name.vi}`, `Explore ${p.name.en}`),
        buyPath: t(`/san-pham/${p.urlSlug.vi}`, `/san-pham/${p.urlSlug.en}`),
      };
    })
    .filter(Boolean);
  const hero = slides.length ? { ...home.hero, ...slides[0], slides } : home.hero;

  // 2) Câu chuyện: "16 thành phần" = số thành phần thật; ô liều dùng theo "Cách dùng"
  const n = mq?.ingredients?.length;
  const story = {
    ...home.story,
    paragraphs: home.story.paragraphs.map((para) =>
      n
        ? t(
            para.vi.replace(/\d+ thành phần/, `${n} thành phần`),
            para.en.replace(/\d+ ingredients/, `${n} ingredients`),
          )
        : para,
    ),
    pillars: home.story.pillars.map((pl) => {
      const p = bySlug(
        products,
        pl.label.vi === "Mayqueen Slim"
          ? "mayqueen-slim"
          : pl.label.vi === "Yodetox Extra"
            ? "yodetox-extra"
            : "",
      );
      return p ? { ...pl, label: p.name, text: doseOf(p) ?? pl.text } : pl;
    }),
  };

  // 3) Khối sản phẩm: "tiết kiệm đến …" = mức giảm lớn nhất đang có
  const save = maxSaving(products);
  const showcase = {
    ...home.showcase,
    text: save
      ? t(
          `Dùng riêng từng sản phẩm hoặc chọn combo — tiết kiệm đến ${fmtVnd(save, "vi")} so với mua lẻ.`,
          `Use each on its own or choose a bundle — save up to ${fmtVnd(save, "en")} compared with buying separately.`,
        )
      : t(
          "Dùng riêng từng sản phẩm hoặc chọn combo liệu trình.",
          "Use each on its own or choose a ritual bundle.",
        ),
  };

  // 4) Chứng nhận: số viên / lọ, số gói / hộp theo "Quy cách"
  const stats = home.certificatesHeading.stats.map((st) => {
    if (/viên/.test(st.label.vi))
      return { ...st, value: countIn(mq?.spec?.vi, "viên") ?? st.value };
    if (/gói/.test(st.label.vi)) return { ...st, value: countIn(yd?.spec?.vi, "gói") ?? st.value };
    return st;
  });

  return {
    ...home,
    hero,
    story,
    showcase,
    certificatesHeading: { ...home.certificatesHeading, stats },
  };
}
