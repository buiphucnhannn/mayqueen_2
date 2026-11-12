/**
 * Kết quả .lean() là object thô của Mongo (_id, __v) → chuẩn hóa trước khi trả ra API:
 * _id → id (string), bỏ __v. Áp dụng đệ quy cho mảng.
 */
export function toDTO(doc) {
  if (Array.isArray(doc)) return doc.map(toDTO);
  if (!doc || typeof doc !== "object") return doc;
  const { _id, __v, ...rest } = doc; // eslint-disable-line no-unused-vars
  return _id ? { id: String(_id), ...rest } : rest;
}
