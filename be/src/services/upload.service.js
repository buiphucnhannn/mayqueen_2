import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

function ensureEnabled() {
  if (!env.cloudinary.enabled) throw ApiError.unavailable("Cloudinary chưa được cấu hình");
}

/** Đẩy buffer (từ multer memoryStorage) lên Cloudinary bằng stream — không ghi file tạm. */
function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result),
    );
    stream.end(buffer);
  });
}

const toImage = (r) => ({
  url: r.secure_url,
  publicId: r.public_id,
  width: r.width,
  height: r.height,
});

export const uploadService = {
  /**
   * @param {Express.Multer.File[]} files
   * @param {string} subfolder vd. "products", "articles"
   */
  async uploadImages(files, subfolder = "misc") {
    ensureEnabled();
    if (!files?.length) throw ApiError.badRequest("Chưa chọn ảnh");
    const results = await Promise.all(
      files.map((f, index) =>
        uploadBuffer(f.buffer, {
          folder: `${env.cloudinary.folder}/${subfolder}`,
          resource_type: "image",
          // Lưu ảnh gốc; khi hiển thị thêm f_auto,q_auto vào URL để Cloudinary tự tối ưu (WebP/AVIF)
        }).catch((err) => {
          // Cloudinary từ chối (file hỏng / không phải ảnh thật / định dạng lạ) → lỗi 422 tiếng Việt chỉ rõ ảnh nào,
          // thay vì 500 "Internal server error". Lỗi mạng / cấu hình (5xx của Cloudinary) vẫn để báo 500.
          const code = err?.http_code ?? 0;
          if (code >= 500 || !code) throw err;
          throw ApiError.unprocessable(
            `Ảnh “${f.originalname || `số ${index + 1}`}” không đọc được (file hỏng hoặc không phải ảnh). Hãy chọn ảnh JPG / PNG / WebP khác.`,
            [{ field: "files", index, message: err?.message?.slice(0, 200) ?? "invalid image" }],
          );
        }),
      ),
    );
    return results.map(toImage);
  },

  /**
   * Chép ảnh từ link ngoài về Cloudinary của website (Cloudinary tự tải link — server mình không gọi tới
   * link lạ → không có rủi ro SSRF). Link không phải ảnh / không truy cập được → 422 dễ hiểu.
   */
  async uploadFromUrl(url, subfolder = "misc") {
    ensureEnabled();
    try {
      const r = await cloudinary.uploader.upload(url, {
        folder: `${env.cloudinary.folder}/${subfolder}`,
        resource_type: "image",
        timeout: 60_000,
      });
      return toImage(r);
    } catch (err) {
      throw ApiError.unprocessable(
        "Không tải được ảnh từ link này — kiểm tra link có đúng là ảnh và mở được công khai không",
        [{ field: "body.url", message: err?.message?.slice(0, 200) ?? "upload failed" }],
      );
    }
  },

  async deleteImage(publicId) {
    ensureEnabled();
    const { result } = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    if (result !== "ok") throw ApiError.notFound("Image not found");
  },
};
