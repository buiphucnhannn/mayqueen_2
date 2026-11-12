import { createHash } from "node:crypto";
import { Types } from "mongoose";
import {
  adminConfigured,
  adminUser,
  checkAdminCredentials,
  credentialFingerprint,
} from "../config/admin.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { toMs } from "../utils/duration.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./token.service.js";

const sha256 = (v) => createHash("sha256").update(v).digest("hex");
// Refresh token cũ dùng lại trong 30s (nhiều tab / request song song) → cấp phiên mới, không coi là đánh cắp
const REFRESH_REUSE_GRACE_MS = 30_000;

const expired = () =>
  new ApiError(401, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", {
    code: "SESSION_EXPIRED",
  });

/**
 * Không chọn "Ghi nhớ đăng nhập": cookie hết khi đóng trình duyệt, và máy chủ cũng chỉ giữ phiên tối đa
 * 12 giờ kể từ lần hoạt động cuối (phòng khi trình duyệt khôi phục cookie lúc mở lại tab).
 */
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;

/** Tạo phiên + cặp token cho người dùng */
async function issueSession(user, meta, remember) {
  const id = new Types.ObjectId();
  const refreshToken = signRefreshToken(id, user.id);
  await sessionRepository.create({
    _id: id,
    user: user.id,
    credential: credentialFingerprint(),
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + (remember ? toMs(env.jwt.refreshTtl) : SHORT_SESSION_MS)),
    remember,
    userAgent: String(meta.userAgent ?? "").slice(0, 300),
    ip: meta.ip ?? "",
  });
  return { id, user, remember, accessToken: signAccessToken(user), refreshToken };
}

export const authService = {
  async login({ username, password, remember = false }, meta) {
    if (!adminConfigured())
      throw ApiError.unavailable("Tài khoản quản trị chưa được cấu hình", "ADMIN_NOT_CONFIGURED");
    if (!checkAdminCredentials(username, password))
      throw new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng", {
        code: "INVALID_CREDENTIALS",
      });

    const user = adminUser();
    const session = await issueSession(user, meta, remember);
    await sessionRepository.revokeOldest(user.id, env.maxSessions);
    return session;
  },

  /**
   * Đăng nhập nhanh (demo) — vào thẳng tài khoản admin, không cần mật khẩu. CHỈ khi DEMO_LOGIN=true.
   * Phiên ngắn (không "ghi nhớ"), tạo y như đăng nhập thường → đăng xuất / hết hạn / đổi mật khẩu đều áp dụng.
   */
  async demoLogin(meta) {
    if (!env.demoLogin) throw ApiError.notFound("Not found");
    if (!adminConfigured())
      throw ApiError.unavailable("Tài khoản quản trị chưa được cấu hình", "ADMIN_NOT_CONFIGURED");
    const user = adminUser();
    const session = await issueSession(user, meta, false);
    await sessionRepository.revokeOldest(user.id, env.maxSessions);
    return session;
  },

  /** Xoay vòng refresh token: mỗi lần làm mới cấp token mới, token cũ bị thu hồi */
  async refresh(refreshToken, meta) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw expired();

    const session = await sessionRepository.findByTokenHash(sha256(refreshToken));
    if (!session || String(session._id) !== payload.sid) throw expired();
    // hết hạn nhưng chưa bị chỉ mục TTL dọn (chạy mỗi ~60 giây)
    if (new Date(session.expiresAt).getTime() <= Date.now()) throw expired();
    const remember = session.remember !== false;

    // Tài khoản trong .env đã đổi → phiên cũ vô hiệu
    if (session.credential !== credentialFingerprint() || session.user !== env.admin.id) {
      await sessionRepository.revokeIfActive(session._id);
      throw expired();
    }

    if (session.revokedAt) {
      // Thu hồi do đăng xuất / vượt số thiết bị → hết phiên
      if (!session.replacedBy) throw expired();
      // Token đã xoay vòng bị dùng lại: trong thời gian ân hạn → tab song song; quá hạn → nghi bị đánh cắp
      if (Date.now() - new Date(session.revokedAt).getTime() > REFRESH_REUSE_GRACE_MS) {
        logger.error(
          { event: "auth.token_reuse", actor: session.user, ip: meta?.ip },
          "[auth.token_reuse] refresh token cũ bị dùng lại — thu hồi mọi phiên",
        );
        await sessionRepository.revokeAllForUser(session.user);
        throw expired();
      }
      // tab song song trong thời gian ân hạn → cấp phiên mới, nhưng vẫn giữ giới hạn số thiết bị (MAX_SESSIONS)
      const extra = await issueSession(adminUser(), meta, remember);
      await sessionRepository.revokeOldest(env.admin.id, env.maxSessions);
      return extra;
    }

    const next = await issueSession(adminUser(), meta, remember);
    const won = await sessionRepository.revokeIfActive(session._id, next.id);
    if (!won) {
      // Request khác vừa xoay vòng trước — chấp nhận nếu là xoay vòng (không phải đăng xuất)
      const latest = await sessionRepository.findById(session._id);
      if (!latest?.replacedBy) {
        await sessionRepository.revokeIfActive(next.id);
        throw expired();
      }
    }
    return next;
  },

  async logout(refreshToken) {
    if (!refreshToken) return;
    const session = await sessionRepository.findByTokenHash(sha256(refreshToken));
    if (session) await sessionRepository.revokeIfActive(session._id);
  },

  async me(userId) {
    if (!adminConfigured() || userId !== env.admin.id) throw expired();
    return adminUser();
  },
};
