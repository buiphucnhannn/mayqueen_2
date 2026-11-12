import { Router } from "express";
import { z } from "zod";
import { uploadController } from "../controllers/upload.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { env } from "../config/env.js";
import { limiter } from "../middlewares/rate-limit.middleware.js";

const router = Router();
router.use(requireAdmin);

// POST /api/v1/uploads/images?folder=products   (multipart/form-data, field "files", tối đa 10 ảnh)
router.post(
  "/images",
  uploadImages.array("files", 10),
  validate({
    query: z.object({
      folder: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default("misc"),
    }),
  }),
  uploadController.images,
);

// POST /api/v1/uploads/images/from-url   body: { url, folder } — chép ảnh từ link ngoài về Cloudinary
router.post(
  "/images/from-url",
  limiter({
    windowMs: 60_000,
    limit: 60,
    message: "Thêm ảnh từ link quá nhanh, vui lòng chờ 1 phút",
  }),
  validate({
    body: z.object({
      url: z
        .string()
        .trim()
        .max(2048)
        .regex(/^https?:\/\/[^\s]+$/i, "Link ảnh phải bắt đầu bằng http:// hoặc https://"),
      folder: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default("misc"),
    }),
  }),
  uploadController.fromUrl,
);

// GET  /api/v1/uploads/orphans          — xem trước ảnh không còn dùng (không xóa)
// POST /api/v1/uploads/orphans/cleanup  — dọn ngay (cũng tự chạy mỗi 24 giờ, xem media.service.js)
const cleanupLimiter = limiter({ windowMs: 60 * 1000, limit: 3 }); // gọi Admin API Cloudinary — hạn chế bấm dồn
router.get("/orphans", cleanupLimiter, uploadController.orphans);
router.post("/orphans/cleanup", cleanupLimiter, uploadController.cleanup);

// DELETE /api/v1/uploads/images   body: { publicId }
router.delete(
  "/images",
  validate({
    body: z.object({
      // chỉ được xóa ảnh nằm trong thư mục của website (không đụng ảnh khác trên tài khoản Cloudinary)
      publicId: z
        .string()
        .max(300)
        .regex(/^[\w-]+(?:\/[\w-]+)+$/, "publicId không hợp lệ")
        .refine((id) => id.startsWith(`${env.cloudinary.folder}/`), "Ảnh không thuộc website"),
    }),
  }),
  uploadController.remove,
);

export default router;
