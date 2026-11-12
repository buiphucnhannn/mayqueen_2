import { z } from "zod";
import {
  image,
  localized,
  objectId,
  optionalLocalized,
  pageQuery,
  searchQuery,
  slugInput,
} from "./common.validator.js";

const option = z.object({
  optionId: z.coerce.string().trim().min(1),
  label: localized,
  note: optionalLocalized,
  price: z.number().int().nonnegative(),
  compareAt: z.number().int().nonnegative().optional(),
  popular: z.boolean().optional().default(false),
});

const ingredient = z.object({ name: localized, note: optionalLocalized });

const productFields = z.object({
  category: z.string().trim().toLowerCase().min(1).max(80), // phải là danh mục đang có (service kiểm tra)
  name: localized,
  badge: optionalLocalized,
  ritual: optionalLocalized,
  tagline: optionalLocalized,
  short: optionalLocalized,
  description: optionalLocalized,
  spec: optionalLocalized,
  benefits: z.array(localized).max(20).default([]),
  ingredients: z.array(ingredient).max(60).default([]),
  excipients: optionalLocalized,
  usage: z.array(localized).max(20).default([]),
  // ≥1 ảnh: thẻ sản phẩm, trang chi tiết, ảnh chia sẻ đều dùng ảnh đầu tiên (thiếu → giao diện lỗi)
  images: z.array(image).min(1, "Cần ít nhất 1 ảnh sản phẩm").max(20),
  options: z.array(option).min(1, "Cần ít nhất 1 gói giá").max(20),
  isActive: z.boolean().default(true),
  slug: slugInput,
  slugEn: slugInput,
  // sortOrder: server tự xếp (thêm mới → cuối; đổi bằng kéo-thả / nút trong bảng)
});

function productRules(p, ctx) {
  // mã gói phải khác nhau — đơn hàng tra giá theo slug + optionId
  const ids = p.options.map((o) => o.optionId);
  if (new Set(ids).size !== ids.length)
    ctx.addIssue({ code: "custom", path: ["options"], message: "Mã gói bị trùng" });
  p.options.forEach((o, i) => {
    if (o.compareAt != null && o.compareAt <= o.price)
      ctx.addIssue({
        code: "custom",
        path: ["options", i, "compareAt"],
        message: "Giá gốc phải lớn hơn giá bán",
      });
  });
}

export const createProductSchema = productFields.superRefine(productRules);

// PUT gửi nguyên form (giống POST) — đơn giản, tránh lệch dữ liệu giữa các mảng lồng nhau.
// expectedUpdatedAt: thời điểm sửa của bản admin đang mở → bản trên server mới hơn (sửa ở tab / tên miền khác)
// thì từ chối 409 thay vì ghi đè mất dữ liệu (xem product.service.js)
export const updateProductSchema = productFields
  .extend({ expectedUpdatedAt: z.iso.datetime().optional() })
  .superRefine(productRules);

/** Bật / tắt hiển thị (công tắc trong bảng) — chỉ đổi đúng 1 trường, không gửi lại cả sản phẩm */
export const setActiveSchema = z.object({ isActive: z.boolean() });

export const listProductsQuery = pageQuery.extend({
  category: z.string().trim().toLowerCase().min(1).max(80).optional(),
});

export const manageProductsQuery = pageQuery.extend({
  category: z.string().trim().toLowerCase().min(1).max(80).optional(),
  status: z.enum(["active", "hidden"]).optional(),
  q: searchQuery,
});

export const reorderSchema = z.object({
  ids: z.array(objectId).min(1).max(500), // thứ tự mới của TOÀN BỘ sản phẩm
});

export const slugParam = z.object({ slug: z.string().trim().toLowerCase().min(1) });
