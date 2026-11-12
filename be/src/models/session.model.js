import { Schema, model } from "mongoose";

/**
 * Phiên đăng nhập (mỗi thiết bị 1 phiên). Chỉ lưu HASH của refresh token, không lưu token gốc.
 * - Mỗi lần làm mới: tạo phiên mới, phiên cũ đánh dấu revokedAt + replacedBy (xoay vòng token).
 * - Token cũ bị dùng lại sau thời gian ân hạn → coi là bị đánh cắp → thu hồi toàn bộ phiên.
 * - Tự xóa khi hết hạn (TTL index trên expiresAt).
 */
const sessionSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    credential: { type: String, required: true }, // dấu vân tay tài khoản lúc tạo phiên
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    // "Ghi nhớ đăng nhập" — giữ nguyên qua các lần xoay vòng token (phiên cũ chưa có trường này = ghi nhớ)
    remember: { type: Boolean, default: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: Schema.Types.ObjectId, default: null },
    userAgent: { type: String, maxlength: 300, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model("Session", sessionSchema);
