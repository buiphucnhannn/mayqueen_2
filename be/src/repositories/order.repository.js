import { Order } from "../models/order.model.js";
import { BaseRepository } from "./base.repository.js";

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  findByCode(code) {
    return this.model.findOne({ code }).lean();
  }

  /** Đơn đã tạo từ cùng 1 lần bấm "Đặt hàng" (gửi lại sau lỗi mạng) */
  findByIdempotencyKey(idempotencyKey) {
    return this.model.findOne({ idempotencyKey }).select("code total").lean();
  }

  codeExists(code) {
    return this.model.exists({ code });
  }

  /** Cập nhật trạng thái / ghi chú; đổi trạng thái thì ghi thêm 1 dòng vào statusHistory */
  async updateAdmin(id, { status, adminNote }) {
    const current = await this.model.findById(id).select("status").lean();
    if (!current) return null;
    const update = { $set: {} };
    if (adminNote !== undefined) update.$set.adminNote = adminNote;
    if (status && status !== current.status) {
      update.$set.status = status;
      update.$push = { statusHistory: { status, at: new Date() } };
    }
    return this.model
      .findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true })
      .lean();
  }

  /** Xóa đơn CHỈ KHI đang ở trạng thái "Đã hủy" (1 lệnh duy nhất → không bị đổi trạng thái chen giữa) */
  deleteCancelled(id) {
    return this.model.findOneAndDelete({ _id: id, status: "cancelled" }).select("code").lean();
  }
}

export const orderRepository = new OrderRepository();
