import { Schema, model } from "mongoose";
import { imageSchema, localizedString, toJSONOptions } from "./shared.schema.js";

const articleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // cố định, tự sinh
    slugEn: { type: String, lowercase: true, trim: true, unique: true, sparse: true }, // đường dẫn /en/...
    // Đường dẫn CŨ (VI/EN) trước khi Admin đổi → link cũ tự chuyển (308) sang đường dẫn hiện tại thay vì 404
    oldSlugs: { type: [String], default: [], index: true },
    category: { type: String, required: true, trim: true, index: true }, // slug chuyên mục (Category type=article)
    title: { type: localizedString(true), required: true },
    excerpt: { type: localizedString(), default: () => ({}) },
    cover: { type: imageSchema, required: true }, // ảnh vuông: thẻ bài viết
    banner: { type: imageSchema, default: undefined }, // ảnh ngang: đầu bài + thẻ nổi bật (thiếu → dùng cover)
    // Nội dung bài (HTML từ trình soạn thảo, đã lọc an toàn ở validator) — song ngữ
    body: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    publishedAt: { type: Date, required: true, default: Date.now, index: true }, // tự đặt lúc đăng bài
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

export const Article = model("Article", articleSchema);
