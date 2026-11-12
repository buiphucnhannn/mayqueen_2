import { Schema, model } from "mongoose";
import { consentSchema, toJSONOptions } from "./shared.schema.js";

// Mới → Đang liên hệ (đang gọi / chờ khách phản hồi) → Đã liên hệ (đã tư vấn xong)
export const LEAD_STATUSES = ["new", "contacting", "contacted"];

/** Đăng ký tư vấn từ popup "Tư vấn miễn phí" ở frontend. */
const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, index: true },
    goal: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    source: { type: String, trim: true, default: "consult-modal" },
    // ngôn ngữ trang khách đang xem → khách đọc tiếng Anh thì admin gọi tư vấn bằng tiếng Anh
    lang: { type: String, enum: ["vi", "en"], default: "vi" },
    consent: { type: consentSchema, default: null }, // đồng ý Chính sách bảo mật (phiên bản + lúc nào)
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    // lần cuối gửi email báo admin thành công (null = chưa báo được → khách gửi lại sẽ báo bù)
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

leadSchema.index({ createdAt: -1 });

export const Lead = model("Lead", leadSchema);
