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
    return this.model
      .findOne({ idempotencyKey })
      .select("code total paymentMethod paymentStatus")
      .lean();
  }

  /** Số đơn chuyển khoản đang chờ nhận tiền (không tính đơn đã hủy) */
  countAwaitingPayment() {
    return this.model.countDocuments({
      paymentMethod: "bank_transfer",
      paymentStatus: { $ne: "paid" },
      status: { $ne: "cancelled" },
    });
  }

  codeExists(code) {
    return this.model.exists({ code });
  }

  /**
   * Cập nhật trạng thái / ghi chú / trạng thái thanh toán.
   * Đổi trạng thái → thêm 1 dòng statusHistory; xác nhận / bỏ xác nhận thanh toán → thêm 1 dòng paymentHistory.
   */
  async updateAdmin(id, { status, adminNote, paymentStatus }) {
    const current = await this.model.findById(id).select("status paymentStatus").lean();
    if (!current) return null;
    const now = new Date();
    const update = { $set: {}, $push: {} };
    if (adminNote !== undefined) update.$set.adminNote = adminNote;
    if (status && status !== current.status) {
      update.$set.status = status;
      update.$push.statusHistory = { status, at: now };
    }
    if (paymentStatus && paymentStatus !== (current.paymentStatus ?? "unpaid")) {
      update.$set.paymentStatus = paymentStatus;
      update.$set.paidAt = paymentStatus === "paid" ? now : null;
      update.$push.paymentHistory = { status: paymentStatus, at: now };
    }
    if (!Object.keys(update.$push).length) delete update.$push;
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
