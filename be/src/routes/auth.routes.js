import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../validators/auth.validator.js";

const FIFTEEN_MIN = 15 * 60 * 1000;
const tooMany = "Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau ít phút";

// Chống dò mật khẩu — 3 lớp, chỉ đếm lần THẤT BẠI (đăng nhập đúng không bị tính):
const loginLimiter = limiter({
  windowMs: FIFTEEN_MIN,
  limit: 5,
  skipSuccessfulRequests: true,
  message: tooMany,
}); // theo IP
const accountLimiter = limiter({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  skipSuccessfulRequests: true,
  message: tooMany,
  keyGenerator: (req) =>
    `login:${String(req.body?.username ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 100)}`, // theo tài khoản
});
// Trần chung đặt CAO (300): đủ chặn tấn công phân tán quy mô lớn, nhưng vài kẻ phá thử sai mật khẩu không khoá
// được chủ shop (trước đây 50 → 1 người gõ bừa 50 lần là admin thật cũng không đăng nhập được 15 phút)
const globalLoginLimiter = limiter({
  windowMs: FIFTEEN_MIN,
  limit: 300,
  skipSuccessfulRequests: true,
  message: tooMany,
  keyGenerator: () => "login:global", // ngắt mạch toàn hệ thống khi bị tấn công phân tán
});
const refreshLimiter = limiter({ windowMs: 60 * 1000, limit: 60 });

const router = Router();

router.post(
  "/login",
  globalLoginLimiter,
  loginLimiter,
  accountLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
router.post("/refresh", refreshLimiter, authController.refresh);
router.get("/resume", refreshLimiter, authController.resume);
// Không bắt buộc access token: để quá 15 phút rồi bấm Đăng xuất vẫn thu hồi phiên + xóa cookie
// (phiên xác định qua cookie refresh; origin-guard vẫn chặn CSRF)
router.post("/logout", refreshLimiter, authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
