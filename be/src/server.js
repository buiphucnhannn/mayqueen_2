import { readFile } from "node:fs/promises";
import { createApp } from "./app.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { mediaService } from "./services/media.service.js";
import { printStartupBanner } from "./utils/banner.js";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

/** Điểm khởi động: kết nối dịch vụ ngoài → mở cổng → tắt êm khi nhận tín hiệu dừng. */
async function bootstrap() {
  configureCloudinary();
  await connectDatabase();
  mediaService.startSchedule(); // dọn ảnh Cloudinary không còn dùng: sau 10 phút, rồi mỗi 24 giờ

  const server = createApp().listen(env.port, () =>
    // chờ log của pino (ghi bất đồng bộ) in xong rồi mới in khung thông tin
    setTimeout(() => printStartupBanner({ name: "Mayqueen Slim API", version: pkg.version }), 150),
  );

  const shutdown = (signal) => {
    logger.info(`${signal} received - shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // quá 10s thì buộc dừng
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled rejection");
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.fatal({ err }, "Startup failed");
  process.exit(1);
});
