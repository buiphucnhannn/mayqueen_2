/**
 * Ô tìm kiếm ở trang quản trị → RegExp an toàn cho MongoDB:
 * - Thoát ký tự đặc biệt (không chèn được biểu thức lạ / ReDoS).
 * - KHÔNG phân biệt hoa thường và KHÔNG phân biệt dấu tiếng Việt: "nguyen" tìm ra "Nguyễn", "giam can" ra
 *   "giảm cân", "dao" ra "Đào" (người Việt hay gõ không dấu khi tìm nhanh).
 * - Từ khóa toàn số (số điện thoại): bỏ dấu cách / chấm / gạch, "+84…" → "0…" để khớp số đã lưu thống nhất.
 */
const VARIANTS = {
  a: "aàáảãạăằắẳẵặâầấẩẫậ",
  e: "eèéẻẽẹêềếểễệ",
  i: "iìíỉĩị",
  o: "oòóỏõọôồốổỗộơờớởỡợ",
  u: "uùúủũụưừứửữự",
  y: "yỳýỷỹỵ",
  d: "dđ",
};
// mỗi chữ cái gốc → nhóm ký tự gồm cả chữ hoa (không phụ thuộc cách MongoDB gập chữ hoa Unicode)
const CLASS = Object.fromEntries(
  Object.entries(VARIANTS).map(([k, v]) => [k, `[${v}${v.toUpperCase()}]`]),
);

/** Bỏ dấu tiếng Việt: "Nguyễn Đào" → "nguyen dao" */
// NFD tách chữ và dấu → bỏ mọi dấu kết hợp (\p{M}) → còn chữ gốc
const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();

const escape = (ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function searchRegex(q) {
  let text = String(q).trim();
  // số điện thoại: "+84 912.345 678" → "0912345678"
  if (/^[\d\s.\-+()]+$/.test(text) && /\d/.test(text))
    text = text.replace(/[\s.\-()]/g, "").replace(/^\+84/, "0");
  const pattern = [...fold(text)].map((ch) => CLASS[ch] ?? escape(ch)).join("");
  return new RegExp(pattern, "i");
}
