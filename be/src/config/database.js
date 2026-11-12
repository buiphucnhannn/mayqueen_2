import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

// Thử kết nối lại khi khởi động: mạng chập chờn / Atlas phản hồi chậm vài chục giây (wifi rớt, Render vừa thức dậy)
// KHÔNG làm server chết ngay. Chờ tăng dần giữa các lần; hết lượt mới báo lỗi (server.js dừng app).
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000]; // tối đa 5 lần thử
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Kết nối MongoDB Atlas. Gọi 1 lần khi khởi động server. */
export async function connectDatabase() {
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  for (let attempt = 0; ; attempt++) {
    try {
      await mongoose.connect(env.mongo.uri, {
        dbName: env.mongo.dbName,
        serverSelectionTimeoutMS: 10_000,
        autoIndex: !env.isProd, // production: tạo index bằng migration / Atlas UI
      });
      break;
    } catch (err) {
      if (attempt >= RETRY_DELAYS_MS.length) throw err;
      const wait = RETRY_DELAYS_MS[attempt];
      logger.warn(
        { err: err.message },
        `MongoDB chưa kết nối được (lần ${attempt + 1}/${RETRY_DELAYS_MS.length + 1}) — thử lại sau ${wait / 1000}s`,
      );
      await mongoose.disconnect().catch(() => {});
      await sleep(wait);
    }
  }
  logger.debug("MongoDB connected");
  await ensureCriticalIndexes();
}

/**
 * Index bắt buộc cho tính đúng đắn (không chỉ để nhanh) → tạo ngay cả ở production (autoIndex tắt).
 * createIndex đã có thì bỏ qua, không khoá bảng (index thưa trên trường mới, dữ liệu cũ không có trường này).
 */
async function ensureCriticalIndexes() {
  try {
    // chống tạo trùng đơn khi khách bấm "Đặt hàng" lại sau lỗi mạng (xem order.service.js)
    await mongoose.connection
      .collection("orders")
      .createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true, name: "idempotencyKey_1" });
  } catch (err) {
    logger.warn(
      { err },
      "[db] không tạo được index idempotencyKey — vẫn chạy, chống trùng đơn bằng truy vấn",
    );
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

/** Dùng cho /health: 1 = connected */
export const isDatabaseReady = () => mongoose.connection.readyState === 1;
