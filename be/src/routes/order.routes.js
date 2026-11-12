import { Router } from "express";
import { z } from "zod";
import { orderController } from "../controllers/order.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParam, phone } from "../validators/common.validator.js";
import {
  createOrderSchema,
  listOrdersQuery,
  orderCodeParam,
  updateOrderSchema,
} from "../validators/order.validator.js";

const router = Router();

// Đặt hàng: 10 đơn / 15 phút / IP là dư cho khách thật (gõ sai không bị tính) — chặn bot đặt đơn ảo
const orderLimiter = limiter({
  windowMs: 15 * 60_000,
  limit: 10,
  skipFailedRequests: true,
  message: "Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau ít phút hoặc gọi hotline.",
});
// Tra cứu đơn: chỉ đếm lần KHÔNG tìm thấy → chặn dò mã đơn + SĐT của người khác
const trackLimiter = limiter({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Tra cứu sai quá nhiều lần, vui lòng thử lại sau 15 phút.",
});

// Cấp trước mã đơn cho QR chuyển khoản: 30 lần / 15 phút / IP (khách đổi qua lại COD ↔ chuyển khoản vài lần là đủ)
const transferLimiter = limiter({
  windowMs: 15 * 60_000,
  limit: 30,
  message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút hoặc gọi hotline.",
});

// Public: đặt hàng + khách tra cứu đơn (mã đơn + SĐT)
// (đặt TRƯỚC "/:id" để "bank-transfer" không bị hiểu là id đơn)
router.get("/bank-transfer", transferLimiter, orderController.reserveTransfer);
router.post("/", orderLimiter, validate({ body: createOrderSchema }), orderController.create);
router.get(
  "/track/:code",
  trackLimiter,
  validate({ params: orderCodeParam, query: z.object({ phone }) }),
  orderController.track,
);

// Admin
router.get("/", requireAdmin, validate({ query: listOrdersQuery }), orderController.list);
router.get("/stats", requireAdmin, orderController.stats);
router.get("/:id", requireAdmin, validate({ params: idParam }), orderController.getById);
router.patch(
  "/:id",
  requireAdmin,
  validate({ params: idParam, body: updateOrderSchema }),
  orderController.update,
);
router.delete("/:id", requireAdmin, validate({ params: idParam }), orderController.remove);

export default router;
