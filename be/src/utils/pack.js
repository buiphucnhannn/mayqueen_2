/**
 * "Cần chuẩn bị" cho 1 dòng đơn hàng — nói theo đơn vị KHO đóng hàng (lọ, hộp), không theo quy cách bên trong
 * (30 viên, 20 gói × 2 g là thông tin cho khách, không phải thứ cần lấy).
 * - Combo (ghi chú dạng "2 Mayqueen Slim + 2 Yodetox Extra") × SL → nhân từng món: "4 Mayqueen Slim + 4 Yodetox Extra"
 * - Sản phẩm lẻ: lấy số + đơn vị ở cuối tên gói ("1 lọ", "Combo 1 - 2 lọ", "1 hộp") × SL → "2 lọ Mayqueen Slim"
 * Giữ ĐỒNG BỘ với fe/src/lib/pack.js (trang Admin).
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
