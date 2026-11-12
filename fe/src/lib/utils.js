import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Gộp className, tự loại bỏ class Tailwind bị trùng/xung đột.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value, lang = "vi") {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

// vi: "12/10/2026" (cách ghi ngày quen thuộc ở VN, thay cho "12 thg 10, 2026") · en: "12 Oct 2026"
export function formatDate(iso, lang = "vi") {
  const d = new Date(`${iso}T00:00:00`);
  if (lang !== "en") {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Gói giá rẻ nhất — giá "Chỉ từ" / nút thêm nhanh trên thẻ (không phụ thuộc thứ tự gói admin sắp xếp) */
export const cheapestOption = (product) =>
  product.options.reduce((min, o) => (o.price < min.price ? o : min), product.options[0]);

export const discountPercent = (price, compareAt) =>
  compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

/**
 * Số điện thoại Việt Nam — KHỚP VỚI be/src/utils/phone.js (sửa 1 bên phải sửa cả bên kia).
 * Di động 03/05/07/08/09 + 8 số; cố định 02x + 8 số; đầu 0 hoặc +84; cho phép cách / chấm / gạch / ngoặc.
 * Loại số rác kiểu 0999999999 (phần sau đầu số lặp 1 chữ số).
 */
const VN_PHONE = /^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/;
export const normalizePhone = (value = "") => String(value).replace(/[\s.\-()]/g, "");

/**
 * Lọc NGAY KHI GÕ / DÁN vào ô số điện thoại: chỉ giữ chữ số, dấu + (chỉ ở đầu) và ký tự ngăn cách
 * thường gặp (khoảng trắng . - ( )). Chữ cái, thẻ HTML, emoji… bị loại luôn, không hiện trong ô.
 */
export const phoneInput = (value = "") =>
  String(value)
    .replace(/[^\d+\s.\-()]/g, "")
    .replace(/(?!^)\+/g, "")
    .replace(/\s{2,}/g, " ");
export function isValidPhone(value) {
  const p = normalizePhone(value);
  if (!VN_PHONE.test(p)) return false;
  return !/^(\d)\1+$/.test(p.replace(/^(?:\+84|0)\d/, ""));
}

/**
 * Họ tên — KHỚP VỚI personName ở be/src/validators/common.validator.js.
 * Chữ cái (có dấu, mọi ngôn ngữ) + khoảng trắng và . ' - giữa các chữ; 2–60 ký tự.
 */
const NAME_RX = /^[\p{L}\p{M}]+(?:(?:[.'’-]\s?|\s)[\p{L}\p{M}]+)*\.?$/u;
export const NAME_MAX = 60;
export const cleanName = (value = "") => value.normalize("NFC").replace(/\s+/g, " ").trim();
/** → null nếu hợp lệ, hoặc "empty" | "short" | "invalid" để form chọn câu báo lỗi phù hợp */
export function nameProblem(value) {
  const name = cleanName(value);
  if (!name) return "empty";
  if (name.length < 2) return "short";
  if (name.length > NAME_MAX || !NAME_RX.test(name)) return "invalid";
  return null;
}

// Từ ghép tiếng Việt hay gặp trong tiêu đề — 2 âm tiết luôn đi cùng dòng (tránh "BUỔI / SÁNG", "GIẢM / CÂN")
const VI_PHRASES = new Set([
  "buổi sáng",
  "buổi trưa",
  "buổi tối",
  "mỗi ngày",
  "hằng ngày",
  "giấc ngủ",
  "giảm cân",
  "giảm béo",
  "giảm mỡ",
  "tăng cân",
  "cân nặng",
  "mỡ thừa",
  "vòng eo",
  "vòng bụng",
  "vóc dáng",
  "giữ dáng",
  "cơ thể",
  "sức khỏe",
  "sức khoẻ",
  "làn da",
  "căng mọng",
  "cơn đói",
  "chế ngự",
  "chế độ",
  "ăn uống",
  "ăn kiêng",
  "thực phẩm",
  "nước ép",
  "trà xanh",
  "chuyển hóa",
  "chuyển hoá",
  "trao đổi",
  "tiêu hóa",
  "tiêu hoá",
  "đường ruột",
  "thanh lọc",
  "giải độc",
  "bí quyết",
  "công thức",
  "thủ phạm",
  "thói quen",
  "lối sống",
  "tập luyện",
  "vận động",
  "liệu trình",
  "sản phẩm",
  "chính hãng",
  "hiệu quả",
  "an toàn",
  "tự nhiên",
  "khoa học",
  "phụ nữ",
  "sau sinh",
  "mẹ bỉm",
  "bổ sung",
  "bảo vệ",
  "diệp lục",
  "hương cam",
  "lá sen",
  "quả bứa",
]);
const bare = (w) => w.toLowerCase().replace(/^[“"'(«]+|[”"'),.:;!?»]+$/g, "");

const OPEN_QUOTE = /^[“"«]/;
const CLOSE_QUOTE = /[”"»][,.:;!?]?$/;

/**
 * Nối bằng khoảng trắng không ngắt → trình duyệt không xuống dòng giữa:
 * - từ ghép tiếng Việt quen thuộc ("buổi sáng", "giảm cân"…)
 * - cụm ngắn trong ngoặc kép (≤ 4 chữ, VD “cơn đói giả”)
 * - dấu gạch dài "—" / "–" với chữ đứng trước (không để dấu gạch mở đầu dòng mới)
 */
export function keepPhrases(text = "") {
  const words = text.split(" ");
  const glue = new Array(words.length).fill(false); // glue[i]: nối words[i] với chữ trước
  words.forEach((w, i) => {
    if (i > 0 && VI_PHRASES.has(`${bare(words[i - 1])} ${bare(w)}`)) glue[i] = true;
    if (i > 0 && /^[—–]$/.test(w)) glue[i] = true;
    if (i > 0 && w.length === 1) glue[i] = true; // chữ / ký hiệu 1 ký tự ("Vitamin C", "&") đi cùng chữ trước
    if (OPEN_QUOTE.test(w) && !CLOSE_QUOTE.test(w)) {
      const end = words.findIndex((x, j) => j > i && CLOSE_QUOTE.test(x));
      if (end > i && end - i <= 3) for (let j = i + 1; j <= end; j++) glue[j] = true;
    }
  });
  return words.reduce((out, w, i) => (i === 0 ? w : out + (glue[i] ? "\u00a0" : " ") + w), "");
}

// Nối 2 từ cuối bằng khoảng trắng không ngắt → tiêu đề không rớt 1 chữ lẻ ở dòng cuối
export function noOrphan(text = "") {
  const i = text.lastIndexOf(" ");
  return i > 0 ? `${text.slice(0, i)} ${text.slice(i + 1)}` : text;
}
