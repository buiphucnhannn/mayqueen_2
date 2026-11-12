/** "Thực phẩm bổ sung" → "thuc-pham-bo-sung" (bỏ dấu tiếng Việt) */
export function slugify(text = "") {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
