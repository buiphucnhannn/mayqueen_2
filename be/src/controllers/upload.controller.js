import { audit } from "../config/logger.js";
import { mediaService } from "../services/media.service.js";
import { uploadService } from "../services/upload.service.js";
import { ApiError } from "../utils/ApiError.js";
import { created, noContent, ok } from "../utils/response.js";

export const uploadController = {
  async images(req, res) {
    const images = await uploadService.uploadImages(req.files, req.validated.query.folder);
    audit(req, "upload.images", { folder: req.validated.query.folder, count: images.length });
    created(res, images);
  },

  async fromUrl(req, res) {
    const { url, folder } = req.validated.body;
    const image = await uploadService.uploadFromUrl(url, folder);
    audit(req, "upload.from_url", { folder, host: new URL(url).hostname });
    created(res, image);
  },

  async remove(req, res) {
    const { publicId } = req.validated.body;
    // ảnh còn được sản phẩm / bài viết dùng → không cho xóa (tránh ảnh vỡ trên website)
    if (await mediaService.isUsed(publicId))
      throw ApiError.conflict(
        "Ảnh đang được sản phẩm / bài viết sử dụng — gỡ ảnh khỏi nội dung trước",
      );
    await uploadService.deleteImage(publicId);
    audit(req, "upload.delete", { publicId });
    noContent(res);
  },

  /** Xem trước ảnh không còn dùng (> 24 giờ) — KHÔNG xóa */
  async orphans(_req, res) {
    ok(res, await mediaService.sweep({ dryRun: true }));
  },

  /** Dọn ngay ảnh không còn dùng (> 24 giờ) — cùng luật với lần quét tự động mỗi ngày */
  async cleanup(req, res) {
    const report = await mediaService.sweep();
    audit(req, "upload.cleanup", {
      deleted: report.deleted,
      bytes: report.bytes,
      skipped: report.skipped,
    });
    ok(res, report);
  },
};
