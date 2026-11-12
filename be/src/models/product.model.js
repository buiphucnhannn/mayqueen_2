import { Schema, model } from "mongoose";
import { imageSchema, localizedString, toJSONOptions } from "./shared.schema.js";

/** Gói / lựa chọn mua (1 lọ, combo...) — giá tính bằng VND. optionId cố định để đơn cũ vẫn tra được. */
const optionSchema = new Schema(
  {
    optionId: { type: String, required: true, trim: true },
    label: { type: localizedString(true), required: true },
    note: { type: localizedString(), default: () => ({}) },
    price: { type: Number, required: true, min: 0 },
    compareAt: { type: Number, min: 0 },
    popular: { type: Boolean, default: false }, // gắn nhãn "Phổ biến" + chọn sẵn trên trang chi tiết
  },
  { _id: false },
);

/** Thành phần: tên + định lượng / ghi chú (vd. "Chitosan" — "100 mg") */
const ingredientSchema = new Schema(
  {
    name: { type: localizedString(true), required: true },
    note: { type: localizedString(), default: () => ({}) },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // cố định, tự sinh
    slugEn: { type: String, lowercase: true, trim: true, unique: true, sparse: true }, // đường dẫn /en/...
    // Đường dẫn CŨ (VI/EN) trước khi Admin đổi → link cũ tự chuyển (308) sang đường dẫn hiện tại thay vì 404
    oldSlugs: { type: [String], default: [], index: true },
    category: { type: String, required: true, trim: true, index: true }, // slug danh mục (Category type=product)
    name: { type: localizedString(true), required: true },
    badge: { type: localizedString(), default: () => ({}) }, // nhãn góc ảnh: "Bán chạy", "Mới"
    ritual: { type: localizedString(), default: () => ({}) }, // loại sản phẩm: "Thực phẩm bảo vệ sức khỏe"
    tagline: { type: localizedString(), default: () => ({}) },
    short: { type: localizedString(), default: () => ({}) },
    description: { type: localizedString(), default: () => ({}) },
    spec: { type: localizedString(), default: () => ({}) }, // quy cách: "Dạng viên - 1 lọ 30 viên"
    benefits: { type: [localizedString(true)], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
    excipients: { type: localizedString(), default: () => ({}) }, // phụ liệu / thành phần khác
    usage: { type: [localizedString(true)], default: [] }, // cách dùng, mỗi phần tử 1 dòng
    images: { type: [imageSchema], default: [] }, // ảnh đầu tiên = ảnh đại diện
    options: {
      type: [optionSchema],
      validate: [(v) => v.length > 0, "Sản phẩm cần ít nhất 1 gói giá"],
    },
    // Mã gói lớn nhất ĐÃ TỪNG cấp (server tự tăng) → gói mới không bao giờ dùng lại mã của gói đã xóa
    optionSeq: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

export const Product = model("Product", productSchema);
