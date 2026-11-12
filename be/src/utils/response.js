/**
 * Định dạng phản hồi thống nhất cho mọi endpoint:
 *   thành công: { success: true, data, meta? }
 *   lỗi:        { success: false, error: { message, details? } }   (xem error.middleware.js)
 */
export const ok = (res, data, meta) =>
  res.status(200).json({ success: true, data, ...(meta && { meta }) });

export const created = (res, data) => res.status(201).json({ success: true, data });

export const noContent = (res) => res.status(204).end();
