import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { leadEmail, orderEmail } from "../emails/templates.js";

/**
 * Thông báo cho admin qua email (Resend API — gửi qua HTTPS cổng 443).
 * Vì sao không dùng SMTP: Render gói Free CHẶN cổng SMTP 25 / 465 / 587 (từ 26/09/2025) → nodemailer + Gmail
 * sẽ không bao giờ gửi được. Resend gọi qua HTTPS nên chạy được trên mọi gói.
 *
 * - Chạy NỀN sau khi đơn / yêu cầu đã lưu → gửi lỗi hay chậm cũng KHÔNG ảnh hưởng khách đặt hàng.
 * - Lỗi tạm thời (mạng, 429, 5xx) → thử lại 3 lần (chờ tăng dần). Idempotency-Key theo mã đơn → thử lại không
 *   gửi trùng email.
 * - Chưa cấu hình (thiếu RESEND_API_KEY / ADMIN_NOTIFY_EMAILS) → bỏ qua, chỉ ghi log.
 */
const ENDPOINT = "https://api.resend.com/emails";
// mạng chập chờn (ECONNRESET), 429, 5xx → thử lại 3 lần; Idempotency-Key đảm bảo không gửi trùng
const RETRY_DELAYS = [2_000, 6_000, 15_000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Gửi 1 email qua Resend. Trả { id } khi thành công, ném lỗi khi thất bại hẳn. */
export async function sendMail({ subject, html, text, idempotencyKey, to = env.mail.to }) {
  if (!env.mail.resendKey) throw new Error("Chưa cấu hình RESEND_API_KEY");
  if (!to.length) throw new Error("Chưa cấu hình ADMIN_NOTIFY_EMAILS");
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.mail.resendKey}`,
          "Content-Type": "application/json",
          ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
        },
        body: JSON.stringify({ from: env.mail.from, to, subject, html, text }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { id: data.id };
      const err = new Error(
        `Resend HTTP ${res.status}: ${data.message ?? data.name ?? "lỗi không rõ"}`,
      );
      err.retry = res.status === 429 || res.status >= 500;
      throw err;
    } catch (err) {
      const transient = err.retry || err.name === "TimeoutError" || err.name === "TypeError";
      if (!transient || attempt >= RETRY_DELAYS.length) throw err;
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

/** Gửi nền, không chặn request; lỗi chỉ ghi log */
function sendLater(kind, ref, build, { key = `${kind}-${ref}`, onSent } = {}) {
  if (!env.mail.enabled) {
    logger.info(
      { event: "notify.skipped", kind, ref },
      `[notify] chưa cấu hình RESEND_API_KEY / ADMIN_NOTIFY_EMAILS — không gửi email ${kind} ${ref}`,
    );
    return;
  }
  setImmediate(async () => {
    try {
      const mail = build();
      const { id } = await sendMail({ ...mail, idempotencyKey: key });
      logger.info({ event: "notify.sent", kind, ref, id }, `[notify] đã gửi email ${kind} ${ref}`);
      await onSent?.();
    } catch (err) {
      logger.warn(
        { event: "notify.failed", kind, ref, err: err.message },
        `[notify] gửi email ${kind} ${ref} thất bại`,
      );
    }
  });
}

export const notifyService = {
  /** order: bản ghi đơn vừa lưu (code, customer, lines, subtotal, shippingFee, total, createdAt) */
  newOrder(order) {
    sendLater("order", order.code, () => orderEmail(order, { siteUrl: env.mail.siteUrl }));
  },
  /**
   * lead: yêu cầu tư vấn vừa lưu / vừa được khách cập nhật (updated).
   * Mỗi lần báo có khóa riêng (gửi bù / cập nhật không bị Resend coi là trùng lần trước), nhưng cố định trong
   * các lần thử lại của cùng 1 lần báo → không bao giờ nhận 2 email cho 1 sự kiện.
   */
  newLead(lead, { updated = false, onSent } = {}) {
    const ref = String(lead._id ?? lead.id);
    sendLater("lead", ref, () => leadEmail(lead, { siteUrl: env.mail.siteUrl, updated }), {
      key: `lead-${ref}-${Date.now()}`,
      onSent,
    });
  },
};
