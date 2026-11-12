import { Router } from "express";
import { leadController } from "../controllers/lead.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParam } from "../validators/common.validator.js";
import {
  createLeadSchema,
  listLeadsQuery,
  updateLeadStatusSchema,
} from "../validators/lead.validator.js";

const router = Router();

/**
 * Chống spam form "Tư vấn miễn phí" (theo IP; cùng SĐT gửi lại trong 10 phút đã được gộp ở service):
 * - Người thật chỉ gửi 1–2 lần → 5 lần / 10 phút là dư; gõ sai bị báo lỗi (4xx) KHÔNG bị tính.
 * - Trần 20 lần / ngày chặn bot gửi rải rác.
 */
const LEAD_MSG =
  "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau ít phút hoặc gọi hotline để được hỗ trợ ngay.";
const leadBurstLimiter = limiter({
  windowMs: 10 * 60_000,
  limit: 5,
  skipFailedRequests: true,
  message: LEAD_MSG,
});
const leadDailyLimiter = limiter({
  windowMs: 24 * 60 * 60_000,
  limit: 20,
  skipFailedRequests: true,
  message: LEAD_MSG,
});

// Public: form "Tư vấn miễn phí"
router.post(
  "/",
  leadBurstLimiter,
  leadDailyLimiter,
  validate({ body: createLeadSchema }),
  leadController.create,
);

// Admin
router.get("/", requireAdmin, validate({ query: listLeadsQuery }), leadController.list);
router.get("/stats", requireAdmin, leadController.stats);
router.patch(
  "/:id/status",
  requireAdmin,
  validate({ params: idParam, body: updateLeadStatusSchema }),
  leadController.updateStatus,
);
router.delete("/:id", requireAdmin, validate({ params: idParam }), leadController.remove);

export default router;
