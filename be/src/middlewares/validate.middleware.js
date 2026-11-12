import { ApiError } from "../utils/ApiError.js";

/**
 * Kiểm tra req.body / req.query / req.params bằng schema Zod.
 *   router.post("/", validate({ body: createOrderSchema }), controller.create)
 * Dữ liệu sau khi parse (đã chuẩn hóa, bỏ trường lạ) lưu ở req.validated.{body,query,params}.
 */
export const validate = (schemas) => (req, _res, next) => {
  req.validated = {};
  for (const key of ["params", "query", "body"]) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: [key, ...i.path].join("."),
        message: i.message,
      }));
      return next(ApiError.unprocessable("Validation failed", details));
    }
    req.validated[key] = result.data;
  }
  next();
};
