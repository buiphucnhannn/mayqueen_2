/**
 * KHÔI PHỤC dữ liệu từ bản sao lưu (scripts/backup.js).
 *
 *   npm run backup:list                         → xem các bản sao lưu đang có
 *   npm run restore -- latest                   → XEM TRƯỚC bản mới nhất (chưa đụng vào dữ liệu)
 *   npm run restore -- latest --yes             → khôi phục bản mới nhất
 *   npm run restore -- <tên file> --yes         → khôi phục đúng 1 bản
 *   npm run restore -- latest --only=orders,leads --yes   → chỉ khôi phục vài bảng
 *   npm run restore -- latest --to-db=mayqueen_xem_lai --yes → khôi phục sang DB KHÁC để xem lại, DB thật giữ nguyên
 *
 * An toàn:
 * - Không có --yes → chỉ in ra sẽ làm gì.
 * - Trước khi ghi đè, TỰ SAO LƯU dữ liệu hiện tại (file "truoc-khoi-phuc-…", giữ 2 bản) → khôi phục nhầm vẫn quay lại được.
 * - Chỉ thay các bảng có trong bản sao lưu; bảng khác (vd. phiên đăng nhập) giữ nguyên.
 */
import { basename, join } from "node:path";
import { env } from "../src/config/env.js";
import {
  BACKUP_DIR,
  acquireLock,
  connect,
  createBackup,
  disconnect,
  ensureDir,
  humanSize,
  listBackups,
  log,
  prune,
  readBackup,
  vnTime,
} from "./lib/backup-core.js";

const PREFIX = "mayqueen";
const SAFETY_PREFIX = "truoc-khoi-phuc";
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const yes = args.includes("--yes");
const only = flag("only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const toDb = flag("to-db");
const target = args.find((a) => !a.startsWith("--"));

let release = null;
try {
  await ensureDir();
  const backups = await listBackups(PREFIX, env.mongo.dbName);

  if (!target || target === "list") {
    console.log(`Bản sao lưu trong ${BACKUP_DIR} (mới nhất trước):`);
    if (!backups.length) console.log("  (chưa có bản nào)");
    for (const b of backups) console.log(`  ${b.name}   ${humanSize(b.size)}   ${vnTime(b.mtime)}`);
    const safety = await listBackups(SAFETY_PREFIX, env.mongo.dbName);
    if (safety.length) {
      console.log("Bản tự lưu trước các lần khôi phục:");
      for (const b of safety) console.log(`  ${b.name}   ${humanSize(b.size)}`);
    }
    console.log("\nKhôi phục: npm run restore -- latest   (xem trước)  |  thêm --yes để thực hiện");
    process.exit(0);
  }

  const file = target === "latest" ? backups[0]?.file : join(BACKUP_DIR, basename(target)); // chỉ nhận tên file trong thư mục sao lưu
  if (!file) throw new Error("Chưa có bản sao lưu nào");

  // Đọc + kiểm tra toàn bộ file trước (file hỏng thì dừng, chưa đụng vào DB)
  const { meta, counts } = await readBackup(file, { countOnly: true });
  const cols = meta.collections.map((c) => c.name).filter((n) => !only || only.includes(n));
  if (only) {
    const unknown = only.filter((n) => !meta.collections.some((c) => c.name === n));
    if (unknown.length) throw new Error(`Bản sao lưu không có bảng: ${unknown.join(", ")}`);
  }
  const dbName = toDb || env.mongo.dbName;

  console.log(
    `File:      ${basename(file)} (sao lưu lúc ${vnTime(new Date(meta.createdAt))}, DB "${meta.db}")`,
  );
  console.log(
    `Khôi phục vào DB: "${dbName}"${toDb ? " (DB khác — DB thật không bị ảnh hưởng)" : ""}`,
  );
  for (const c of cols)
    console.log(
      `  - ${c}: ${counts[c] ?? 0} tài liệu (dữ liệu hiện tại của bảng này sẽ được THAY THẾ)`,
    );

  if (!yes) {
    console.log("\nĐây là bản XEM TRƯỚC, chưa thay đổi gì. Thêm --yes để khôi phục thật.");
    process.exit(0);
  }

  release = await acquireLock();
  const db = await connect(env.mongo.uri, dbName);

  // Lưới an toàn: sao lưu dữ liệu đang có trước khi ghi đè
  const existing = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  if (existing.some((n) => cols.includes(n))) {
    const s = await createBackup(db, { prefix: SAFETY_PREFIX });
    await log(`Khôi phục: đã tự lưu dữ liệu hiện tại → ${s.name}`);
    await prune(SAFETY_PREFIX, dbName, 2);
  }

  await log(`Khôi phục ${basename(file)} → DB "${dbName}" (${cols.join(", ")})`);
  const batches = Object.fromEntries(cols.map((c) => [c, []]));
  const flush = async (c) => {
    if (batches[c].length) await db.collection(c).insertMany(batches[c], { ordered: false });
    batches[c] = [];
  };
  for (const c of cols) if (existing.includes(c)) await db.collection(c).drop();
  await readBackup(file, {
    onDoc: async (c, doc) => {
      if (!batches[c]) return; // bảng không chọn (--only)
      batches[c].push(doc);
      if (batches[c].length >= 500) await flush(c);
    },
  });
  for (const c of cols) {
    await flush(c);
    const indexes = meta.collections.find((x) => x.name === c).indexes;
    if (indexes.length) await db.collection(c).createIndexes(indexes);
    const n = await db.collection(c).countDocuments();
    if (n !== (counts[c] ?? 0)) throw new Error(`${c}: khôi phục ${n}/${counts[c]} tài liệu`);
  }
  await log(`Khôi phục THÀNH CÔNG: ${cols.map((c) => `${c} ${counts[c] ?? 0}`).join(", ")}`);
  await disconnect();
} catch (err) {
  await log(`Khôi phục THẤT BẠI: ${err.message}`);
  await disconnect().catch(() => {});
  process.exitCode = 1;
} finally {
  await release?.();
}
