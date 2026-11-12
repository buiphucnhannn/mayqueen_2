import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../models/order.model.js";
import {
  consent,
  pageQuery,
  personName,
  phone,
  plainText,
  searchQuery,
} from "./common.validator.js";

// Khớp payload gửi từ fe/src/components/forms/CheckoutForm.jsx.
// KHÔNG nhận giá từ client — giá luôn tính lại ở server.
export const createOrderSchema = z.object({
  customer: z.object({
    name: personName,
    phone,
    address: z.string().trim().min(1, "Vui lòng nhập địa chỉ").max(300),
    province: z.string().trim().max(120).optional().default(""),
    note: plainText(1000).optional().default(""),
  }),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        optionId: z.coerce.string().min(1),
        qty: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1, "Giỏ hàng trống")
    .max(30),
  // hình thức thanh toán khách chọn (phí ship tính lại ở server theo hình thức này)
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default("cod"),
  lang: z.enum(["vi", "en"]).optional().default("vi"),
  consent,
  website: z.string().max(500).optional().default(""), // ô bẫy bot (người dùng không thấy)
  // chống trùng đơn khi gửi lại (UUID do trình duyệt tạo cho mỗi lần đặt)
  idempotencyKey: z
    .string()
    .regex(/^[A-Za-z0-9-]{16,64}$/)
    .optional(),
  // tổng tiền khách đang thấy → lệch với giá hiện tại (admin vừa đổi giá) thì báo khách xem lại, không tự tính khác
  expectedTotal: z.coerce.number().int().min(0).optional(),
});

export const listOrdersQuery = pageQuery.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  q: searchQuery, // mã đơn / SĐT / tên khách
  // lọc theo thanh toán: cod | bank_transfer | awaiting (chuyển khoản chưa nhận tiền) | paid (đã nhận tiền)
  payment: z.enum(["cod", "bank_transfer", "awaiting", "paid"]).optional(),
});

export const orderCodeParam = z.object({ code: z.string().trim().min(4).max(20) });

export const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    adminNote: z.string().trim().max(2000).optional(),
    // "paid" = admin đã đối chiếu sao kê, xác nhận đã nhận tiền chuyển khoản; "unpaid" = bỏ xác nhận (bấm nhầm)
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    // bản admin đang mở → đơn đã đổi sau đó (người khác / tab khác) thì 409, không ghi đè (utils/stale.js)
    expectedUpdatedAt: z.iso.datetime().optional(),
  })
  .refine(
    (v) => v.status || v.paymentStatus || v.adminNote !== undefined,
    "Không có gì để cập nhật",
  );
