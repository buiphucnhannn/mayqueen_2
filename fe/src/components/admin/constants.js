/** Nhãn + màu trạng thái — dùng chung cho các trang quản trị (danh mục: xem Categories.jsx) */
export const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", tone: "amber" },
  confirmed: { label: "Đã xác nhận", tone: "sage" },
  shipping: { label: "Đang giao", tone: "sky" },
  completed: { label: "Hoàn tất", tone: "green" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
};

/** Hình thức thanh toán (khớp PAYMENT_METHODS ở be/src/models/order.model.js) */
export const PAYMENT_METHOD = {
  cod: { label: "COD", full: "Thanh toán khi nhận hàng (COD)" },
  bank_transfer: { label: "Chuyển khoản", full: "Chuyển khoản ngân hàng (VietQR)" },
};

/** Trạng thái nhận tiền của đơn chuyển khoản */
export const PAYMENT_STATUS = {
  unpaid: { label: "Chờ chuyển khoản", tone: "amber" },
  paid: { label: "Đã thanh toán", tone: "green" },
};

/** Bộ lọc thanh toán ở trang Đơn hàng (?payment=) — khớp listOrdersQuery ở be/src/validators/order.validator.js */
export const PAYMENT_FILTERS = [
  // nhãn ngắn, trùng chữ trên nhãn màu ở bảng ("Chờ chuyển khoản", "Đã thanh toán") → không bị cắt chữ
  { value: "", label: "Mọi thanh toán" },
  { value: "cod", label: "COD" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "awaiting", label: "Chờ chuyển khoản" },
  { value: "paid", label: "Đã thanh toán" },
];

export const LEAD_STATUS = {
  new: { label: "Mới", tone: "amber" },
  contacting: { label: "Đang liên hệ", tone: "sky" },
  contacted: { label: "Đã liên hệ", tone: "green" },
};

/** Tab lọc theo trạng thái kèm số lượng */
export const statusTabs = (map, stats) => [
  { value: "", label: "Tất cả", count: stats?.total },
  ...Object.entries(map).map(([value, s]) => ({
    value,
    label: s.label,
    count: stats ? (stats.byStatus[value] ?? 0) : undefined,
  })),
];
