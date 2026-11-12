import { z } from "zod";
import { isValidPhone, normalizePhone } from "../utils/phone.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const idParam = z.object({ id: objectId });

export const pageQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const phone = z
  .string()
  .trim()
  .max(20, "Số điện thoại không hợp lệ")
  .refine(isValidPhone, "Số điện thoại không hợp lệ")
  .transform(normalizePhone);

/**
 * Họ tên khách (form tư vấn, đặt hàng) — KHỚP VỚI isValidName ở fe/src/lib/utils.js.
 * Chỉ chữ cái (mọi ngôn ngữ, có dấu) + khoảng trắng và . ' - giữa các chữ; 2–60 ký tự.
 * Chặn số, link, ký tự lạ / thẻ HTML mà bot spam hay chèn vào ô tên.
 */
const NAME_RX = /^[\p{L}\p{M}]+(?:(?:[.'’-]\s?|\s)[\p{L}\p{M}]+)*\.?$/u;
export const personName = z
  .string()
  .max(200, "Họ tên tối đa 60 ký tự")
  .transform((s) => s.normalize("NFC").replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(1, "Vui lòng nhập họ tên")
      .min(2, "Họ tên quá ngắn")
      .max(60, "Họ tên tối đa 60 ký tự")
      .regex(NAME_RX, "Họ tên chỉ gồm chữ cái và khoảng trắng"),
  );

/** Chữ thuần do khách nhập (lời nhắn, ghi chú): bỏ ký tự điều khiển vô hình, giới hạn độ dài */
export const plainText = (max) =>
  z
    .string()
    .max(max * 2) // chặn payload khổng lồ trước khi xử lý
    // eslint-disable-next-line no-control-regex -- cố ý: tìm đúng các ký tự điều khiển để XÓA
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max, `Tối đa ${max} ký tự`));

export const localized = z.object({
  vi: z.string().trim().min(1),
  en: z.string().trim().default(""),
});

export const optionalLocalized = z
  .object({ vi: z.string().trim().default(""), en: z.string().trim().default("") })
  .optional();

/** Ảnh đã upload (Cloudinary) — dùng chung cho sản phẩm, bài viết */
export const image = z.object({
  url: z.url({ protocol: /^https$/ }), // chỉ https (chặn javascript:, data:, http:)
  publicId: z.string().optional().default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().optional().default(""),
});

/** Ô tìm kiếm ở trang quản trị (?q=) */
export const searchQuery = z.string().trim().max(100).optional();

/** Đường dẫn nhập từ form (trống = tự sinh từ tên; server chuẩn hóa bằng slugify) */
export const slugInput = z.string().trim().max(120).optional().default("");

/** slug URL: chữ thường không dấu, số, gạch ngang */
export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang")
  .max(120);

/**
 * Khách tick "Tôi đồng ý … Chính sách bảo mật" (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15: sự đồng ý phải rõ ràng,
 * chủ động, và doanh nghiệp phải CHỨNG MINH được) → lưu phiên bản chính sách + thời điểm đồng ý.
 * BẮT BUỘC: mọi đơn hàng / yêu cầu tư vấn đều phải có (chặn cả request gọi thẳng API không qua website,
 * hoặc trang cũ chưa có ô tick) → trả 422 kèm lời nhắc, không lưu.
 */
const CONSENT_REQUIRED =
  "Vui lòng tick đồng ý Chính sách bảo mật trước khi gửi (nếu không thấy ô đồng ý, hãy tải lại trang)";
export const consent = z.object(
  {
    privacy: z.literal(true, { error: CONSENT_REQUIRED }),
    version: z.string().trim().min(1).max(20),
  },
  { error: CONSENT_REQUIRED },
);

/** { privacy, version } từ form → bản lưu DB { version, at } (thời điểm theo máy chủ, không tin trình duyệt) */
export const consentRecord = (c) => (c ? { version: c.version, at: new Date() } : undefined);
