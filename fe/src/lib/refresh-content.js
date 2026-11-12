import { refreshPublicContent as refreshAction } from "@/lib/revalidate";

/**
 * Admin lưu / xoá xong → xoá cache website (server action trong lib/revalidate.js).
 * KHÔNG BAO GIỜ báo lỗi: dữ liệu đã lưu thành công rồi, chỉ là website chưa làm mới ngay (mất mạng, hoặc
 * vừa deploy bản mới khi tab admin còn mở → "Failed to find Server Action"). Nếu ném lỗi, form sẽ báo
 * "lưu thất bại" dù đã lưu → admin bấm lưu lại → tạo trùng sản phẩm / bài viết.
 * Trả false → form hiện "website sẽ cập nhật trong ít phút" như khi không làm mới được.
 */
export const refreshPublicContent = (tag) => refreshAction(tag).catch(() => false);
