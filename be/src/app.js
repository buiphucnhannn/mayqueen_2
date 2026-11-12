import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { httpLogger } from "./middlewares/http-logger.middleware.js";
import { originGuard } from "./middlewares/origin-guard.middleware.js";
import { proxyGuard } from "./middlewares/proxy-guard.middleware.js";
import { limiter } from "./middlewares/rate-limit.middleware.js";
import apiRoutes from "./routes/index.js";

/**
 * Tạo Express app (KHÔNG listen ở đây — server.js lo việc khởi động,
 * nhờ vậy test có thể import app trực tiếp với supertest).
 *
 * Frontend gọi API qua rewrite cùng origin của Next.js (/api/v1/* → backend) nên cookie đăng nhập
 * là cookie first-party, SameSite=Strict.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy); // số proxy tin cậy (Next.js = 1) → req.ip đúng, không giả mạo được

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "X-Requested-With"],
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(httpLogger);

  app.use(proxyGuard); // chỉ nhận request đi qua frontend (PROXY_SECRET) → IP khách không giả được
  app.use(originGuard); // chống CSRF cho mọi request thay đổi dữ liệu
  app.use(limiter({ windowMs: env.rateLimit.windowMs, limit: env.rateLimit.max })); // giới hạn chung / IP

  app.use("/api/v1", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
