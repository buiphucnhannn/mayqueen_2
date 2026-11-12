/**
 * SAO LƯU TỰ ĐỘNG dữ liệu MongoDB (sản phẩm, đơn hàng, yêu cầu tư vấn, bài viết, danh mục, tài khoản admin…).
 *
 *   npm run backup            (chạy trong thư mục app, đọc MONGODB_URI / MONGODB_DB_NAME từ .env)
 *
 * - Lưu tại ~/backups/mayqueen/ (đổi bằng BACKUP_DIR) — NGOÀI thư mục app nên deploy không làm mất.
 * - Giữ 3 bản gần nhất (đổi bằng BACKUP_KEEP); bản cũ hơn tự xóa, CHỈ sau khi bản mới đã ghi + đọc lại kiểm tra xong
 *   → sao lưu lỗi thì không bao giờ xóa bản cũ.
 * - Lỗi → ghi backup.log, thoát mã 1, và gửi email báo admin (nếu đã cấu hình RESEND_API_KEY + ADMIN_NOTIFY_EMAILS).
 * - Lịch chạy: cPanel → Cron Jobs (xem be/README.md, mục "Sao lưu tự động").
 */
import { env } from "../src/config/env.js";
import {
  BACKUP_DIR,
  KEEP,
  acquireLock,
  connect,
  createBackup,
  disconnect,
  ensureDir,
  humanSize,
  log,
  prune,
  vnTime,
} from "./lib/backup-core.js";

const PREFIX = "mayqueen";
const started = Date.now();
let release = null;

try {
  await ensureDir();
  release = await acquireLock();
  await log(`Bắt đầu sao lưu DB "${env.mongo.dbName}" → ${BACKUP_DIR}`);
  const db = await connect(env.mongo.uri, env.mongo.dbName);
  const r = await createBackup(db, { prefix: PREFIX });
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const detail = Object.entries(r.counts)
    .map(([c, n]) => `${c} ${n}`)
    .join(", ");
  await log(
    `THÀNH CÔNG ${r.name} (${humanSize(r.size)}, ${total} tài liệu: ${detail}; sha256 ${r.sha256.slice(0, 16)}…) trong ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  const removed = await prune(PREFIX, env.mongo.dbName, KEEP);
  if (removed.length)
    await log(`Dọn bản cũ (giữ ${KEEP} bản mới nhất): đã xóa ${removed.join(", ")}`);
  await disconnect();
} catch (err) {
  await log(`THẤT BẠI: ${err.message}`);
  await notifyFailure(err).catch((e) => log(`Không gửi được email báo lỗi: ${e.message}`));
  await disconnect().catch(() => {});
  process.exitCode = 1;
} finally {
  await release?.();
}

/** Email báo admin khi sao lưu lỗi (thành công thì không gửi — tránh làm đầy hộp thư) */
async function notifyFailure(err) {
  if (!env.mail.enabled) return;
  const { sendMail } = await import("../src/services/notify.service.js");
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  await sendMail({
    subject: `[Mayqueen] Sao lưu dữ liệu THẤT BẠI – ${vnTime()}`,
    text: `Sao lưu tự động dữ liệu Mayqueen bị lỗi lúc ${vnTime()}.\nLỗi: ${err.message}\nCác bản sao lưu cũ vẫn còn nguyên (không bị xóa).\nXem chi tiết: ${BACKUP_DIR}/backup.log`,
    html: `<p>Sao lưu tự động dữ liệu Mayqueen bị lỗi lúc <b>${esc(vnTime())}</b>.</p><p>Lỗi: <code>${esc(err.message)}</code></p><p>Các bản sao lưu cũ vẫn còn nguyên (không bị xóa). Xem chi tiết trong <code>${esc(BACKUP_DIR)}/backup.log</code> trên hosting.</p>`,
  });
}
