import { z } from "zod";
import { CATEGORY_TYPES } from "../models/category.model.js";
import { objectId } from "./common.validator.js";

// Tên danh mục ngắn gọn (hiện trên tab lọc, nhãn sản phẩm/bài viết) — tối đa 40 ký tự
export const CATEGORY_NAME_MAX = 40;
const categoryName = z.object({
  vi: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên danh mục")
    .max(CATEGORY_NAME_MAX, `Tên danh mục tối đa ${CATEGORY_NAME_MAX} ký tự`),
  en: z
    .string()
    .trim()
    .max(CATEGORY_NAME_MAX, `Tên tiếng Anh tối đa ${CATEGORY_NAME_MAX} ký tự`)
    .default(""),
});

export const categoryTypeQuery = z.object({ type: z.enum(CATEGORY_TYPES) });

/** Thứ tự mới (kéo-thả): ids = toàn bộ danh mục của loại đó */
export const reorderCategoriesSchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  ids: z.array(objectId).min(1).max(200),
});

export const createCategorySchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  name: categoryName,
});

// slug và loại không đổi được sau khi tạo — chỉ đổi tên / thứ tự
export const updateCategorySchema = z
  .object({ name: categoryName.optional(), sortOrder: z.number().int().optional() })
  .refine((v) => v.name || v.sortOrder !== undefined, "Không có gì để cập nhật");
