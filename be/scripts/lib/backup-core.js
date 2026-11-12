/**
 * Lõi sao lưu / khôi phục MongoDB (dùng chung cho scripts/backup.js và scripts/restore.js).
 *
 * Định dạng file: <tiền tố>-<db>-YYYY-MM-DD_HHmm.ndjson.gz — gzip của các dòng JSON:
 *   dòng 1   { type: "meta", format, version, db, createdAt, collections: [{ name, indexes }] }
 *   mỗi dòng { type: "doc", c: "<collection>", d: <tài liệu dạng EJSON chuẩn> }   ← giữ đúng ObjectId, Date, số…
 *   dòng cuối { type: "end", counts: { <collection>: số tài liệu } }                ← thiếu dòng này = file hỏng
 * Không cần mongodump (hosting cPanel dùng chung không có) — chỉ cần Node + thư viện mongoose sẵn có của backend.
 */
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { chmod, mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip, createGzip } from "node:zlib";
import mongoose from "mongoose";

const { EJSON } = mongoose.mongo.BSON;

export const FORMAT = "mayqueen-backup";
export const VERSION = 1;
/** Thư mục lưu — NGOÀI thư mục app (deploy thay mới thư mục app → bản sao lưu bên trong sẽ mất) */
export const BACKUP_DIR = process.env.BACKUP_DIR || join(homedir(), "backups", "mayqueen");
/** Số bản giữ lại (bản cũ hơn tự xóa SAU khi bản mới đã sao lưu + kiểm tra thành công) */
export const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP) || 3);
/** Collection KHÔNG sao lưu: phiên đăng nhập (tạm thời, khôi phục lại chỉ làm sống lại phiên cũ) */
export const SKIP = new Set(["sessions"]);

const pad = (n) => String(n).padStart(2, "0");
/** Mốc thời gian theo giờ Việt Nam (máy chủ có thể đặt múi giờ khác) */
export function stamp(date = new Date()) {
  const vn = new Date(date.getTime() + 7 * 3600_000);
  return `${vn.getUTCFullYear()}-${pad(vn.getUTCMonth() + 1)}-${pad(vn.getUTCDate())}_${pad(vn.getUTCHours())}${pad(vn.getUTCMinutes())}`;
}
export const vnTime = (date = new Date()) =>
  date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });

export const fileName = (prefix, db, date) => `${prefix}-${db}-${stamp(date)}.ndjson.gz`;
const isBackupFile = (prefix, db) => (f) =>
  f.startsWith(`${prefix}-${db}-`) && f.endsWith(".ndjson.gz");

export const humanSize = (bytes) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export async function ensureDir() {
  await mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });
  await chmod(BACKUP_DIR, 0o700).catch(() => {}); // chỉ tài khoản hosting đọc được (dữ liệu khách hàng)
}

/** Ghi nhật ký vào BACKUP_DIR/backup.log + màn hình */
export async function log(message) {
  const line = `[${vnTime()}] ${message}`;
  console.log(line);
  try {
    const fh = await open(join(BACKUP_DIR, "backup.log"), "a", 0o600);
    await fh.appendFile(`${line}\n`);
    await fh.close();
  } catch {
    // không ghi được log thì vẫn chạy tiếp
  }
}

/** Khóa chống 2 lần chạy chồng nhau (cron + bấm tay cùng lúc). Khóa cũ hơn 2 giờ = tiến trình đã chết → bỏ. */
export async function acquireLock() {
  const lock = join(BACKUP_DIR, ".lock");
  try {
    const s = await stat(lock);
    if (Date.now() - s.mtimeMs > 2 * 3600_000) await rm(lock, { force: true });
  } catch {
    // chưa có khóa
  }
  try {
    const fh = await open(lock, "wx");
    await fh.writeFile(String(process.pid));
    await fh.close();
  } catch {
    throw new Error(
      "Đang có một lần sao lưu / khôi phục khác chạy (file .lock). Thử lại sau ít phút.",
    );
  }
  return () => rm(lock, { force: true });
}

export async function connect(uri, dbName) {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15_000, autoIndex: false });
  return mongoose.connection.db;
}
export const disconnect = () => mongoose.disconnect();

/** Sao lưu toàn bộ DB → file .ndjson.gz đã kiểm tra. Trả { file, size, counts, sha256 } */
export async function createBackup(db, { prefix = "mayqueen" } = {}) {
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system.") && !SKIP.has(n))
    .sort();
  const meta = {
    type: "meta",
    format: FORMAT,
    version: VERSION,
    db: db.databaseName,
    createdAt: new Date().toISOString(),
    collections: [],
  };
  for (const name of collections) {
    const indexes = (await db.collection(name).indexes())
      .filter((i) => i.name !== "_id_")
      .map(({ v: _v, ns: _ns, ...spec }) => spec);
    meta.collections.push({ name, indexes });
  }

  const name = fileName(prefix, db.databaseName);
  const final = join(BACKUP_DIR, name);
  const tmp = join(BACKUP_DIR, `.tmp-${name}`);
  const counts = {};

  async function* lines() {
    yield `${JSON.stringify(meta)}\n`;
    for (const c of collections) {
      counts[c] = 0;
      for await (const doc of db.collection(c).find({}).batchSize(500)) {
        counts[c]++;
        yield `${JSON.stringify({ type: "doc", c, d: EJSON.serialize(doc, { relaxed: false }) })}\n`;
      }
    }
    yield `${JSON.stringify({ type: "end", counts })}\n`;
  }

  try {
    await pipeline(
      Readable.from(lines()),
      createGzip({ level: 9 }),
      createWriteStream(tmp, { mode: 0o600 }),
    );
    // Đọc lại toàn bộ file vừa ghi: giải nén được, đủ dòng kết thúc, số tài liệu khớp → mới coi là thành công
    const check = await readBackup(tmp, { countOnly: true });
    for (const c of collections) {
      if ((check.counts[c] ?? 0) !== counts[c])
        throw new Error(
          `Kiểm tra lại thất bại: ${c} ghi ${counts[c]} nhưng đọc lại ${check.counts[c] ?? 0}`,
        );
    }
    await rename(tmp, final);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
  const size = (await stat(final)).size;
  return { file: final, name, size, counts, sha256: await sha256(final) };
}

async function sha256(file) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest("hex");
}

/**
 * Đọc file sao lưu. countOnly: chỉ đếm (kiểm tra). onDoc(c, doc): nhận từng tài liệu (khôi phục).
 * File thiếu dòng "end" / sai định dạng → báo lỗi (không khôi phục từ file dở dang).
 */
export async function readBackup(file, { countOnly = false, onDoc } = {}) {
  const rl = createInterface({
    input: createReadStream(file).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  let meta = null;
  let end = null;
  const counts = {};
  for await (const line of rl) {
    if (!line) continue;
    const row = JSON.parse(line);
    if (!meta) {
      if (row.type !== "meta" || row.format !== FORMAT)
        throw new Error("Không phải file sao lưu Mayqueen");
      if (row.version > VERSION)
        throw new Error(`File định dạng v${row.version} mới hơn script (v${VERSION})`);
      meta = row;
    } else if (row.type === "doc") {
      counts[row.c] = (counts[row.c] ?? 0) + 1;
      if (!countOnly && onDoc) await onDoc(row.c, EJSON.deserialize(row.d, { relaxed: false }));
    } else if (row.type === "end") end = row;
  }
  if (!meta) throw new Error("File rỗng");
  if (!end) throw new Error("File sao lưu không hoàn chỉnh (thiếu phần kết thúc)");
  for (const [c, n] of Object.entries(end.counts))
    if ((counts[c] ?? 0) !== n)
      throw new Error(`File hỏng: ${c} cần ${n} tài liệu, đọc được ${counts[c] ?? 0}`);
  return { meta, counts };
}

/** Danh sách bản sao lưu (mới nhất trước) */
export async function listBackups(prefix, db) {
  let files;
  try {
    files = (await readdir(BACKUP_DIR)).filter(isBackupFile(prefix, db));
  } catch {
    return [];
  }
  const out = await Promise.all(
    files.map(async (f) => {
      const s = await stat(join(BACKUP_DIR, f));
      return { name: f, file: join(BACKUP_DIR, f), size: s.size, mtime: s.mtime };
    }),
  );
  return out.sort((a, b) => b.name.localeCompare(a.name)); // tên có mốc thời gian → sắp xếp theo tên là đúng thứ tự
}

/** Giữ `keep` bản mới nhất, xóa phần còn lại. Trả danh sách đã xóa. */
export async function prune(prefix, db, keep) {
  const all = await listBackups(prefix, db);
  const old = all.slice(keep);
  for (const b of old) await rm(b.file, { force: true });
  return old.map((b) => b.name);
}
