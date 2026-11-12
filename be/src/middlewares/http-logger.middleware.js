import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

const path = (req) => (req.originalUrl ?? req.url).split("?")[0]; // bỏ query (có SĐT khách khi tra đơn)

// Không ghi: health check, Render tự gọi "/" kiểm tra server, trình duyệt xin favicon
const SKIP = new Set(["/", "/favicon.ico", "/api/v1/health"]);

// Mã request do proxy phía trước gửi (Next.js / Render) — chỉ nhận chuỗi an toàn, ngắn
const SAFE_ID = /^[\w-]{8,64}$/;

/**
 * Log mỗi request 1 dòng khi phản hồi xong:
 *   local: "GET /api/v1/products 200 - 92ms"
 *   prod : {"level":"info","reqId":"…","req":{"method":"GET","url":"/api/v1/products","ip":"…"},
 *           "res":{"status":200},"responseTime":92,"msg":"GET /api/v1/products 200 - 92ms"}
 * Mỗi request có reqId (trả về header X-Request-Id) → đối chiếu lỗi khách báo với log server.
 * Không ghi header, cookie, body, query.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers["x-request-id"];
    const id = typeof incoming === "string" && SAFE_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  // reqId gắn vào MỌI dòng log của request (cả log sự kiện bảo mật / thao tác quản trị)
  customProps: (req) => ({ reqId: req.id }),
  autoLogging: { ignore: (req) => SKIP.has(path(req)) },
  // 5xx = lỗi server, 4xx = cảnh báo (trừ 401/404 — xảy ra thường xuyên, không đáng báo động)
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400 && ![401, 404].includes(res.statusCode)) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, ms) =>
    `${req.method} ${path(req)} ${res.statusCode} - ${Math.round(ms)}ms`,
  // stack lỗi thật đã được error.middleware ghi (chỉ với lỗi bất ngờ) → dòng request không lặp lại
  customErrorObject: (_req, _res, _err, { err, ...rest }) => rest, // eslint-disable-line no-unused-vars
  customErrorMessage: (req, res) => `${req.method} ${path(req)} ${res.statusCode} - lỗi`,
  serializers: {
    req: (req) => ({ method: req.method, url: path(req), ip: req.raw?.ip }),
    res: (res) => ({ status: res.statusCode }),
  },
});
