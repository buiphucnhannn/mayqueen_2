/** Chuẩn hóa ?page=&limit= → { page, limit, skip } (giới hạn limit tối đa để tránh truy vấn nặng). */
export function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const buildPageMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});
