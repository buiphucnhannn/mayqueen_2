/**
 * "Cần chuẩn bị" cho 1 dòng đơn hàng — nói theo đơn vị KHO đóng hàng (lọ, hộp), không theo quy cách bên trong
 * (30 viên, 20 gói × 2 g là thông tin cho khách, không phải thứ cần lấy).
 * - Combo (ghi chú dạng "2 Mayqueen Slim + 2 Yodetox Extra") × SL → nhân từng món: "4 Mayqueen Slim + 4 Yodetox Extra"
 * - Sản phẩm lẻ: lấy số + đơn vị ở cuối tên gói ("1 lọ", "Combo 1 - 2 lọ", "1 hộp") × SL → "2 lọ Mayqueen Slim"
 * Giữ ĐỒNG BỘ với fe/src/lib/pack.js (trang Admin) — cả packText, unitsFromProducts, packSummary.
 */
export const isComboNote = (note) => (note ?? "").includes("+");

export function packText({ name = "", optionLabel = "", optionNote = "", qty = 1 }) {
  if (isComboNote(optionNote)) {
    const parts = optionNote.split("+").map((s) => s.trim().match(/^(\d+)\s+(.+)$/));
    if (parts.every(Boolean))
      return parts.map(([, n, item]) => `${Number(n) * qty} ${item}`).join(" + ");
    return qty > 1 ? `${qty} × (${optionNote})` : optionNote;
  }
  const unit = optionLabel.match(/(\d+)\s+([^\d\s\-–]+)\s*$/);
  if (unit) return `${Number(unit[1]) * qty} ${unit[2]} ${name}`.trim();
  return `${qty} × ${optionLabel || name}`;
}

/** Số + đơn vị ở cuối tên gói: "1 lọ" → [1, "lọ"], "Combo 1 - 2 lọ" → [2, "lọ"], "Combo 3" → null */
const labelUnit = (label = "") => {
  const m = label.match(/(\d+)\s+([^\d\s\-–]+)\s*$/);
  return m ? [Number(m[1]), m[2]] : null;
};
const keyOf = (name) => name.trim().toLowerCase();

/**
 * Đơn vị kho của từng sản phẩm, đọc từ gói bán LẺ trong Admin: Mayqueen Slim "1 lọ" → "lọ", Yodetox Extra "1 hộp" → "hộp".
 * products: danh sách sản phẩm (name, options[].label / note dạng { vi, en } hoặc chuỗi).
 */
export function unitsFromProducts(products = []) {
  const vi = (v) => (typeof v === "string" ? v : (v?.vi ?? ""));
  const units = {};
  for (const p of products)
    for (const o of p.options ?? []) {
      const u = !isComboNote(vi(o.note)) && labelUnit(vi(o.label));
      if (u && !units[keyOf(vi(p.name))]) units[keyOf(vi(p.name))] = u[1];
    }
  return units;
}

/**
 * Tổng cần chuẩn bị cho CẢ ĐƠN, gộp theo sản phẩm: combo được tách ra từng món, cộng với hàng lẻ.
 * VD Combo 5 ×1 + Combo 3 ×2 + 1 lọ Mayqueen ×2 + 1 hộp Yodetox → [{ Mayqueen Slim, 10, lọ }, { Yodetox Extra, 8, hộp }]
 * Có combo ghi chú không đọc được (không theo dạng "<số> <tên> + …") → null (không đoán).
 */
export function packSummary(lines = [], units = {}) {
  const map = new Map();
  const add = (name, count, unit) => {
    const k = keyOf(name);
    const cur = map.get(k) ?? { name: name.trim(), count: 0, unit: "" };
    cur.count += count;
    cur.unit ||= unit || units[k] || "";
    map.set(k, cur);
  };
  for (const l of lines) {
    const qty = l.qty ?? 1;
    if (isComboNote(l.optionNote)) {
      const parts = l.optionNote.split("+").map((s) => s.trim().match(/^(\d+)\s+(.+)$/));
      if (!parts.every(Boolean)) return null;
      for (const [, n, item] of parts) add(item, Number(n) * qty);
    } else {
      const u = labelUnit(l.optionLabel);
      add(l.name, (u ? u[0] : 1) * qty, u?.[1]);
    }
  }
  return [...map.values()];
}
