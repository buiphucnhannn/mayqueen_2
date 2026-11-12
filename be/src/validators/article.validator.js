import { z } from "zod";
import { isEmptyRichText, sanitizeRichText } from "../utils/rich-text.js";
import {
  image,
  localized,
  optionalLocalized,
  pageQuery,
  searchQuery,
  slugInput,
} from "./common.validator.js";

// Nội dung HTML từ trình soạn thảo → lọc an toàn (chống XSS) ngay khi nhận
const richText = z
  .string()
  .max(500_000)
  .default("")
  .transform((html) => (isEmptyRichText(html) ? "" : sanitizeRichText(html)));

export const articleSchema = z.object({
  category: z.string().trim().toLowerCase().min(1).max(80), // phải là chuyên mục đang có (service kiểm tra)
  title: localized,
  excerpt: optionalLocalized,
  cover: image,
  banner: image.nullish(),
  body: z
    .object({ vi: richText, en: richText })
    .refine((b) => b.vi, "Bài viết chưa có nội dung (tiếng Việt)"),
  slug: slugInput,
  slugEn: slugInput,
  // ngày đăng: server tự ghi lúc đăng
  isPublished: z.boolean().default(true),
});

// Sửa bài: kèm updatedAt của bản đang mở → bản trên server mới hơn thì 409, không ghi đè (utils/stale.js)
export const updateArticleSchema = articleSchema.extend({
  expectedUpdatedAt: z.iso.datetime().optional(),
});

export const listArticlesQuery = pageQuery.extend({
  category: z.string().trim().toLowerCase().min(1).max(80).optional(),
});

export const manageArticlesQuery = pageQuery.extend({
  category: z.string().trim().toLowerCase().min(1).max(80).optional(),
  status: z.enum(["published", "draft"]).optional(),
  q: searchQuery,
});
