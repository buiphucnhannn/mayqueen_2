import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB / ảnh
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

/**
 * Nhận file ảnh vào bộ nhớ (không ghi đĩa) → service đẩy thẳng lên Cloudinary bằng stream.
 *   router.post("/images", uploadImages.single("file"), ...)
 */
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.badRequest(`Định dạng không hỗ trợ: ${file.mimetype}`)),
});
