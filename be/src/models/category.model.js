import { Schema, model } from "mongoose";
import { localizedString, toJSONOptions } from "./shared.schema.js";

export const CATEGORY_TYPES = ["product", "article"];

/**
 * Danh mục sản phẩm / chuyên mục bài viết — quản lý trong Admin.
 * slug cố định sau khi tạo (sản phẩm, bài viết, link #chuyên-mục ở chân trang đều tham chiếu slug).
 */
const categorySchema = new Schema(
  {
    type: { type: String, enum: CATEGORY_TYPES, required: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    name: { type: localizedString(true), required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

categorySchema.index({ type: 1, slug: 1 }, { unique: true });
categorySchema.index({ type: 1, sortOrder: 1 });

export const Category = model("Category", categorySchema);
