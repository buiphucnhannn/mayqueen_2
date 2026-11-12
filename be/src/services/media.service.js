import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { articleRepository } from "../repositories/article.repository.js";
import { productRepository } from "../repositories/product.repository.js";

/**
 * Dọn ảnh Cloudinary không còn dùng — 2 lớp bổ sung cho nhau:
 *
 * 1) Ngay sau khi admin LƯU / XÓA sản phẩm, bài viết (releaseLater): ảnh có ở bản cũ nhưng không còn ở bản mới
 *    → xóa, NẾU không sản phẩm / bài viết nào khác còn dùng. Chạy nền, không làm chậm thao tác lưu.
 * 2) Quét định kỳ mỗi 24 giờ (sweep): gom ảnh mồ côi lọt lưới (upload xong nhưng lưu lỗi, dữ liệu sửa tay…).
 *    Chỉ xóa ảnh đã tồn tại > 24 giờ → không đụng ảnh đang upload dở trong lúc admin bấm Lưu.
 *
 * Chốt an toàn:
 * - Chỉ xóa ảnh trong thư mục của website (CLOUDINARY_FOLDER/…), không đụng ảnh khác trên tài khoản.
 * - "Đang dùng" = ảnh sản phẩm + ảnh đại diện / bìa bài viết + ảnh chèn trong nội dung bài (cả VI và EN).
 *   (Frontend không gắn cứng ảnh Cloudinary nào; đơn hàng không lưu ảnh.)
 * - Ngắt mạch: không thấy ảnh nào đang dùng, hoặc định xóa quá nửa số ảnh → DỪNG, chỉ ghi cảnh báo
 *   (phòng trường hợp kết nối nhầm cơ sở dữ liệu trống mà xóa sạch ảnh thật).
 * - Xóa kèm invalidate → CDN gỡ bản cache. Mọi lần xóa đều ghi log (event media.cleanup).
 */

const DAY = 24 * 3600 * 1000;
const GRACE_MS = DAY; // ảnh mới hơn 24 giờ: chưa xét (có thể đang trong lúc lưu)
const BATCH = 100; // Cloudinary xóa tối đa 100 ảnh / lần gọi
const prefix = () => `${env.cloudinary.folder}/`;

/** URL Cloudinary → public_id (bỏ phần biến đổi f_auto,q_auto…, số phiên bản v123, đuôi file) */
export function publicIdFromUrl(url) {
  const m = String(url ?? "").match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/([^?#]+)/);
  if (!m) return null;
  let parts = m[1].split("/");
  const v = parts.findIndex((p) => /^v\d+$/.test(p));
  if (v >= 0) parts = parts.slice(v + 1);
  else
    while (parts.length > 1 && /^[a-z]{1,3}_/.test(parts[0]) && parts[0].includes("_"))
      parts.shift();
  return decodeURIComponent(parts.join("/")).replace(/\.[a-z0-9]{2,5}$/i, "");
}

const imageId = (img) => (img ? img.publicId || publicIdFromUrl(img.url) : null);
const htmlIds = (html) =>
  [...String(html ?? "").matchAll(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/g)].map((m) =>
    publicIdFromUrl(m[0]),
  );

/** Mọi ảnh 1 sản phẩm / bài viết đang dùng */
export function mediaIds(doc) {
  if (!doc) return new Set();
  return new Set(
    [
      ...(doc.images ?? []).map(imageId),
      imageId(doc.cover),
      imageId(doc.banner),
      ...htmlIds(doc.body?.vi),
      ...htmlIds(doc.body?.en),
    ].filter(Boolean),
  );
}

/** Toàn bộ ảnh đang được website dùng */
async function referencedIds() {
  const [products, articles] = await Promise.all([
    productRepository.find({}, { select: "images" }),
    articleRepository.find({}, { select: "cover banner body" }),
  ]);
  const used = new Set();
  for (const doc of [...products, ...articles]) for (const id of mediaIds(doc)) used.add(id);
  return used;
}

async function destroy(ids, reason) {
  const deleted = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const res = await cloudinary.api.delete_resources(chunk, { invalidate: true });
    deleted.push(
      ...Object.entries(res.deleted ?? {})
        .filter(([, s]) => s === "deleted")
        .map(([id]) => id),
    );
  }
  if (deleted.length)
    logger.info(
      { event: "media.cleanup", reason, count: deleted.length, ids: deleted },
      `[media.cleanup] ${reason}: ${deleted.length} ảnh`,
    );
  return deleted;
}

/** Liệt kê mọi ảnh trong thư mục website trên Cloudinary (phân trang) */
async function listAll() {
  const all = [];
  let next_cursor;
  do {
    const r = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: prefix(),
      max_results: 500,
      next_cursor,
    });
    all.push(...r.resources);
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return all;
}

export const mediaService = {
  /**
   * Sau khi lưu / xóa: ảnh có ở `before` mà không còn ở `after` → xóa nếu không chỗ nào khác dùng.
   * Chạy nền (không chờ), lỗi chỉ ghi log — không bao giờ làm hỏng thao tác lưu của admin.
   */
  releaseLater(before, after = null) {
    if (!env.cloudinary.enabled || env.nodeEnv === "test") return;
    const keep = mediaIds(after);
    const gone = [...mediaIds(before)].filter((id) => !keep.has(id) && id.startsWith(prefix()));
    if (!gone.length) return;
    setImmediate(async () => {
      try {
        const used = await referencedIds();
        const unused = gone.filter((id) => !used.has(id));
        if (unused.length) await destroy(unused, "replaced");
      } catch (err) {
        logger.warn(
          { err, event: "media.cleanup_failed", ids: gone },
          "[media.cleanup] lỗi khi xóa ảnh cũ",
        );
      }
    });
  },

  /** Ảnh có đang được sản phẩm / bài viết nào dùng không (chặn xóa tay ảnh đang dùng) */
  async isUsed(publicId) {
    return (await referencedIds()).has(publicId);
  },

  /**
   * Quét ảnh mồ côi. dryRun = chỉ báo cáo, không xóa.
   * @returns {{ scanned, used, orphans: {publicId, bytes, createdAt}[], bytes, deleted, skipped? }}
   */
  async sweep({ dryRun = false } = {}) {
    if (!env.cloudinary.enabled)
      return {
        scanned: 0,
        used: 0,
        orphans: [],
        bytes: 0,
        deleted: 0,
        skipped: "cloudinary_disabled",
      };
    const [resources, used] = await Promise.all([listAll(), referencedIds()]);
    const cutoff = Date.now() - GRACE_MS;
    const orphans = resources
      .filter((r) => !used.has(r.public_id) && new Date(r.created_at).getTime() < cutoff)
      .map((r) => ({
        publicId: r.public_id,
        bytes: r.bytes,
        createdAt: r.created_at,
        url: r.secure_url,
      }));
    const report = {
      scanned: resources.length,
      used: used.size,
      orphans,
      bytes: orphans.reduce((s, o) => s + (o.bytes || 0), 0),
      deleted: 0,
    };
    // ngắt mạch: dữ liệu bất thường → không xóa gì
    if (resources.length && !used.size) report.skipped = "no_references";
    else if (orphans.length > 20 && orphans.length > resources.length / 2)
      report.skipped = "too_many";
    if (report.skipped) {
      logger.warn(
        {
          event: "media.sweep_skipped",
          reason: report.skipped,
          scanned: resources.length,
          orphans: orphans.length,
        },
        "[media.sweep] bỏ qua — kết quả bất thường, cần kiểm tra tay",
      );
      return report;
    }
    if (!dryRun && orphans.length)
      report.deleted = (
        await destroy(
          orphans.map((o) => o.publicId),
          "sweep",
        )
      ).length;
    return report;
  },

  /** Quét tự động: lần đầu sau 10 phút kể từ khi server chạy, sau đó mỗi 24 giờ */
  startSchedule() {
    // CHỈ production: máy dev thường dùng chung tài khoản Cloudinary nhưng có thể khác DB → quét ở máy dev có
    // thể xoá ảnh thật của website (ảnh mà DB máy dev không biết tới). Cần quét ở máy dev: MEDIA_SWEEP=true.
    if (!env.cloudinary.enabled || !(env.isProd || process.env.MEDIA_SWEEP === "true")) return;
    const run = () =>
      this.sweep().catch((err) =>
        logger.warn({ err, event: "media.sweep_failed" }, "[media.sweep] lỗi"),
      );
    setTimeout(run, 10 * 60 * 1000).unref();
    setInterval(run, DAY).unref();
  },
};
