import { Schema } from "mongoose";

/** Chuỗi song ngữ { vi, en } — khớp với cấu trúc t(vi, en) ở frontend. */
export const localizedString = (required = false) =>
  new Schema(
    {
      vi: { type: String, trim: true, required },
      en: { type: String, trim: true, default: "" },
    },
    { _id: false },
  );

/** Ảnh đã upload lên Cloudinary (lưu publicId để xóa/đổi ảnh sau này). */
export const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    width: Number,
    height: Number,
    alt: { type: String, default: "" },
  },
  { _id: false },
);

/** Bỏ _id/__v, thêm id khi trả JSON ra API. */
export const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
};

/** Bằng chứng khách đồng ý Chính sách bảo mật: phiên bản chính sách + thời điểm (xem validators/common.validator.js) */
export const consentSchema = new Schema(
  { version: { type: String, trim: true }, at: { type: Date } },
  { _id: false },
);
