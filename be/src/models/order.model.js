import { Schema, model } from "mongoose";
import { consentSchema, toJSONOptions } from "./shared.schema.js";

export const ORDER_STATUSES = ["pending", "confirmed", "shipping", "completed", "cancelled"];
// cod: thanh toán khi nhận hàng · bank_transfer: chuyển khoản trước qua mã VietQR (services/payment.service.js)
export const PAYMENT_METHODS = ["cod", "bank_transfer"];
// Trạng thái nhận tiền (dùng cho đơn chuyển khoản: admin đối chiếu sao kê rồi bấm "Xác nhận đã thanh toán")
export const PAYMENT_STATUSES = ["unpaid", "paid"];

/** Dòng hàng — LƯU LẠI tên/giá tại thời điểm đặt (đổi giá sản phẩm sau này không ảnh hưởng đơn cũ). */
const orderLineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    optionId: { type: String, required: true },
    optionLabel: { type: String, default: "" },
    // thành phần gói tại thời điểm đặt (VD "4 Mayqueen Slim + 3 Yodetox Extra") → admin biết đóng gói gì
    optionNote: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 99 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // mã hiển thị cho khách, vd. MQ1ABC2D
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      phone: { type: String, required: true, trim: true, index: true },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      province: { type: String, trim: true, default: "" },
      note: { type: String, trim: true, maxlength: 1000, default: "" },
    },
    lines: { type: [orderLineSchema], required: true },
    consent: { type: consentSchema, default: null }, // đồng ý Chính sách bảo mật (phiên bản + lúc nào)
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "cod" },
    // Đơn cũ (trước khi có chuyển khoản) không có 2 trường này → đọc như "unpaid" (xem payment.service isPaid)
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    paidAt: { type: Date, default: null }, // lúc admin xác nhận đã nhận tiền
    // Nhật ký xác nhận / bỏ xác nhận thanh toán (đối soát: ai cũng thấy đơn được xác nhận nhận tiền lúc nào)
    paymentHistory: {
      type: [
        new Schema(
          {
            status: { type: String, enum: PAYMENT_STATUSES },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: () => [],
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    // Nhật ký đổi trạng thái (ai cũng thấy được đơn đã đi qua những bước nào, lúc nào)
    statusHistory: {
      type: [
        new Schema(
          { status: { type: String, enum: ORDER_STATUSES }, at: { type: Date, default: Date.now } },
          { _id: false },
        ),
      ],
      default: () => [{ status: "pending" }],
    },
    adminNote: { type: String, trim: true, maxlength: 2000, default: "" }, // ghi chú nội bộ, khách không thấy
    lang: { type: String, enum: ["vi", "en"], default: "vi" },
    // Mã 1 lần đặt hàng do trình duyệt tạo: khách bấm "Đặt hàng" lại sau lỗi mạng → trả đơn đã tạo, không tạo đơn
    // thứ 2. Index unique + sparse tạo ở config/database.js. Không trả ra API.
    idempotencyKey: { type: String, select: false },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1 }); // lọc "Chờ chuyển khoản" trong trang quản trị

export const Order = model("Order", orderSchema);
