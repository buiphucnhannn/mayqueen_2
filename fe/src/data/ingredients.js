import { t } from "@/i18n";
import { doseOf } from "@/lib/live-content";
import { productImages as P } from "./images";

/**
 * Khối "Thành phần" trang chủ — lấy thành phần thật của sản phẩm (quản lý trong Admin):
 * hiện đủ 5 thành phần (hoạt chất hàm lượng cao trước), còn lại gộp thành 1 dòng "N thành phần khác"
 * (dẫn tới trang sản phẩm để xem đầy đủ).
 */
const TOP = 5;

// Thông tin riêng từng tab (nhãn, liều dùng, ảnh in trên tấm) — theo slug sản phẩm
const TABS = [
  {
    slug: "mayqueen-slim",
    id: "mayqueen",
    label: "Mayqueen Slim",
    time: t("Uống 2 viên/ngày", "2 tablets a day"),
    image: P.mayqueen.fern,
  },
  {
    slug: "yodetox-extra",
    id: "yodetox",
    label: "Yodetox Extra",
    time: t("2 gói/lần - ngày 2–3 lần", "2 sachets, 2–3 times a day"),
    image: P.yodetox.sage,
  },
];

const UNIT_MG = { mcg: 0.001, µg: 0.001, mg: 1, g: 1000 };

/** "100 mg / gói 2 g" → 100 (mg); không đọc được hàm lượng → 0 (xếp cuối) */
function amountMg(note = "") {
  const m = note.match(/([\d.,]+)\s*(mcg|µg|mg|g)\b/i);
  return m ? parseFloat(m[1].replace(",", ".")) * UNIT_MG[m[2].toLowerCase()] : 0;
}

/** "Diệp lục tố (Natri đồng Chlorophyllin 10%)" → ["Diệp lục tố", "Natri đồng Chlorophyllin 10%"] */
const splitName = (name = "") => {
  const m = name.match(/^(.+?)\s*\((.+)\)$/);
  return m ? [m[1], m[2]] : [name, ""];
};

/** "100 mg / gói 2 g" → "100 mg" (trang chủ chỉ cần hàm lượng; đầy đủ ở trang sản phẩm) */
const shortNote = (note = "") => note.replace(/\s*\/.*$/, "");

/** Dòng 1: tên chính; dòng 2: dạng chất (trong ngoặc) - hàm lượng / vai trò */
function layerOf(g) {
  const [vi, viSub] = splitName(g.name.vi);
  const [en, enSub] = splitName(g.name.en);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1); // "hương lá..." → "Hương lá..."
  const sub = (detail, note) => cap([detail, shortNote(note)].filter(Boolean).join(" - "));
  return { name: t(vi, en), benefit: t(sub(viSub, g.note.vi), sub(enSub, g.note.en)) };
}

/** products: danh sách từ lib/catalog (chuỗi song ngữ { vi, en }) — gọi TRƯỚC localize() */
export function buildIngredientTabs(products) {
  return TABS.flatMap(({ slug, ...tab }) => {
    const p = products.find((x) => x.slug === slug);
    if (!p?.ingredients.length) return [];

    // Luôn hiện đủ 5 dòng (nếu có): hoạt chất có hàm lượng đứng trước (cao → thấp), chưa đủ 5 thì lấy tiếp
    // các thành phần còn lại theo thứ tự nhập trong Admin; phần dư gộp vào dòng "N thành phần khác".
    const ranked = p.ingredients
      .map((g, i) => ({ g, i, mg: amountMg(g.note.vi) }))
      .sort((a, b) => b.mg - a.mg || a.i - b.i)
      .map((x) => x.g);
    const top = ranked.slice(0, TOP);
    const rest = ranked.slice(TOP);

    const layers = top.map(layerOf);
    if (rest.length)
      layers.push({
        more: true,
        name: t(`${rest.length} thành phần khác`, `${rest.length} more ingredients`),
        benefit: t(rest.map((g) => g.name.vi).join(", "), rest.map((g) => g.name.en).join(", ")),
        urlSlug: p.urlSlug,
      });

    // liều dùng trên tab: lấy từ "Cách dùng" trong Admin (thiếu → giữ câu mặc định ở trên)
    return [{ ...tab, label: p.name.vi, time: doseOf(p) ?? tab.time, layers }];
  });
}
