/**
 * Lỗi nghiệp vụ có mã HTTP + mã lỗi máy đọc được (code). Ném ở service/controller/middleware
 * → error middleware trả JSON chuẩn { success:false, error:{ code, message, details? } }.
 *   throw ApiError.notFound("Product not found")
 *   throw new ApiError(401, "Phiên đăng nhập đã hết hạn", { code: "TOKEN_EXPIRED" })
 */
const DEFAULT_CODES = {
  400: "BAD_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION_ERROR",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {{ code?: string, details?: unknown } | unknown} [opts] object {code, details} hoặc details (tương thích cũ)
   */
  constructor(statusCode, message, opts) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    const isOpts =
      opts &&
      typeof opts === "object" &&
      !Array.isArray(opts) &&
      ("code" in opts || "details" in opts);
    this.code = (isOpts && opts.code) || DEFAULT_CODES[statusCode] || "ERROR";
    this.details = isOpts ? opts.details : opts;
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, { details });
  }
  static unauthorized(message = "Unauthorized", code = "UNAUTHENTICATED") {
    return new ApiError(401, message, { code });
  }
  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, message, { code });
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
  static unprocessable(message = "Unprocessable entity", details) {
    return new ApiError(422, message, { details });
  }
  static unavailable(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, { code });
  }
}
