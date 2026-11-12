import mongoose from "mongoose";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** Route không tồn tại → 404 JSON */
export const notFoundHandler = (req, _res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

/**
 * Bắt mọi lỗi (Express 5 tự chuyển lỗi của handler async vào đây — không cần try/catch).
 * Chuyển lỗi Mongoose / Multer / JSON hỏng sang mã HTTP phù hợp; lỗi lạ → 500 (ẩn chi tiết ở production).
 */
/** Lỗi upload (multer) → câu tiếng Việt cho người quản trị */
const MULTER_VI = {
  LIMIT_FILE_SIZE: "Ảnh quá lớn (tối đa 8MB) — hãy chọn ảnh nhỏ hơn",
  LIMIT_FILE_COUNT: "Chọn quá nhiều ảnh trong 1 lần",
  LIMIT_UNEXPECTED_FILE: "File tải lên không hợp lệ",
};

/**
 * Câu báo lỗi do code viết bằng tiếng Anh (VD ApiError.notFound("Product not found")) → tiếng Việt trước khi tới
 * màn hình quản trị (người dùng không rành kỹ thuật). Câu đã là tiếng Việt giữ nguyên.
 */
function toVietnamese(status, message = "") {
  if (status === 404 && /not found/i.test(message))
    return /^Route /.test(message)
      ? "Đường dẫn API không tồn tại"
      : "Không tìm thấy — mục này có thể đã bị xoá. Hãy tải lại trang.";
  if (message === "Validation failed") return "Dữ liệu chưa hợp lệ — vui lòng kiểm tra lại";
  if (message === "Forbidden") return "Bạn không có quyền thực hiện thao tác này";
  if (message === "Unauthorized") return "Vui lòng đăng nhập lại";
  return message;
}

// Express nhận diện error handler qua đủ 4 tham số (giữ _next dù không dùng)
export function errorHandler(err, req, res, _next) {
  let error = err;

  if (err instanceof mongoose.Error.ValidationError) {
    error = ApiError.unprocessable(
      "Dữ liệu chưa hợp lệ — vui lòng kiểm tra lại các ô đã nhập",
      Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest("Dữ liệu không hợp lệ (mã / định dạng sai)");
  } else if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue ?? {});
    error = ApiError.conflict(
      fields.some((f) => f.startsWith("slug"))
        ? "Đường dẫn (slug) này đã được dùng cho mục khác — hãy đổi đường dẫn"
        : "Dữ liệu bị trùng với mục đã có",
    );
  } else if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(MULTER_VI[err.code] ?? "File tải lên không hợp lệ");
  } else if (err?.type === "entity.parse.failed") {
    error = ApiError.badRequest("Dữ liệu gửi lên không đúng định dạng");
  } else if (err?.type === "entity.too.large") {
    // body vượt giới hạn express.json (1MB) → 413, không phải lỗi hệ thống
    error = new ApiError(413, "Dữ liệu gửi lên quá lớn", { code: "PAYLOAD_TOO_LARGE" });
  }

  const status = error instanceof ApiError ? error.statusCode : 500;
  // Lỗi bất ngờ (bug, DB sập...) → ghi đủ stack để sửa; lỗi nghiệp vụ 5xx đã biết (vd. Cloudinary chưa cấu hình)
  // → 1 dòng cảnh báo. Lỗi 4xx đã có trong dòng log request, không ghi thêm.
  if (!(error instanceof ApiError))
    req.log?.error({ err }, `Lỗi không xử lý được: ${err?.message}`);
  else if (status >= 500) req.log?.warn({ code: error.code }, error.message);

  res.status(status).json({
    success: false,
    error: {
      code: error instanceof ApiError ? error.code : "INTERNAL_ERROR",
      message:
        status === 500 && env.isProd
          ? "Máy chủ đang gặp sự cố, vui lòng thử lại sau ít phút"
          : toVietnamese(status, error.message),
      ...(error.details && { details: error.details }),
      ...(error.retryAfter && { retryAfter: error.retryAfter }),
      ...(!env.isProd && status === 500 && { stack: err.stack }),
    },
  });
}
