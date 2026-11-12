/** Nhãn + màu trạng thái — dùng chung cho các trang quản trị (danh mục: xem Categories.jsx) */
export const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", tone: "amber" },
  confirmed: { label: "Đã xác nhận", tone: "sage" },
  shipping: { label: "Đang giao", tone: "sky" },
  completed: { label: "Hoàn tất", tone: "green" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
};

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
