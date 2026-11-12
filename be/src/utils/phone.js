/**
 * Số điện thoại Việt Nam — KHỚP VỚI fe/src/lib/utils.js (sửa 1 bên phải sửa cả bên kia).
 * - Nhập: 0xxx hoặc +84xxx, cho phép khoảng trắng / dấu chấm / gạch ngang / ngoặc (bỏ đi khi lưu).
 * - Di động: đầu 03, 05, 07, 08, 09 + 8 số (10 số). Cố định: 02x + 8 số (11 số).
 * - Loại số "rác" hay gặp ở form: 0999999999, 0333333333... (phần sau đầu số lặp 1 chữ số).
 */
// Lưu 1 dạng duy nhất: bỏ ký tự phân cách và đổi "+84…" → "0…" (cùng 1 số nhập 2 kiểu vẫn tra được đơn,
// gộp được yêu cầu tư vấn trùng, tìm được trong admin)
export const normalizePhone = (value = "") =>
  String(value)
    .replace(/[\s.\-()]/g, "")
    .replace(/^\+84/, "0");

const VN_PHONE = /^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/;

export function isValidPhone(value) {
  const p = normalizePhone(value);
  if (!VN_PHONE.test(p)) return false;
  const subscriber = p.replace(/^(?:\+84|0)\d/, ""); // bỏ đầu số
  return !/^(\d)\1+$/.test(subscriber);
}
