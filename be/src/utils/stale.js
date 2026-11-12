import { ApiError } from "./ApiError.js";

/**
 * Chống ghi đè mất dữ liệu khi 2 nơi cùng sửa (2 tab, 2 tên miền mayqueenslim.com / mayqueen.vn, 2 người):
 * form gửi kèm updatedAt của bản đang mở → bản trên server đã đổi sau đó → 409, admin tải lại rồi sửa tiếp.
 * Không gửi (client cũ) → bỏ qua kiểm tra, chạy như trước.
 */
export function assertNotStale(current, expectedUpdatedAt) {
  if (!expectedUpdatedAt || !current?.updatedAt) return;
  if (new Date(current.updatedAt).getTime() !== new Date(expectedUpdatedAt).getTime())
    throw new ApiError(
      409,
      "Mục này vừa được cập nhật ở một tab / thiết bị khác sau khi bạn mở, nên chưa lưu để tránh ghi đè. Hãy tải lại trang (F5) để xem bản mới nhất rồi sửa lại (nên chép phần vừa gõ ra trước).",
      { code: "STALE_UPDATE" },
    );
}
