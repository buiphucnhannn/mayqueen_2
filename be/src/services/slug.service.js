import { ApiError } from "../utils/ApiError.js";
import { slugify } from "../utils/slugify.js";

/**
 * Đường dẫn song ngữ:
 *   slug   — tiếng Việt (giỏ hàng, đơn hàng, tham chiếu nội bộ dùng slug này)
 *   slugEn — tiếng Anh (/en/...)
 * Để trống → tự sinh từ tên. Admin sửa được: đường dẫn cũ được lưu vào oldSlugs → link cũ tự chuyển
 * hướng (308) sang đường dẫn mới, không bị 404 (giữ thứ hạng Google + link đã chia sẻ).
 * Không trùng với slug / slugEn / oldSlugs của bản ghi khác (proxy nhận cả 3 để chuyển đúng trang).
 */
const takenBy = (repo, value, excludeId) =>
  repo.exists({
    $or: [{ slug: value }, { slugEn: value }, { oldSlugs: value }],
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

/** Đường dẫn cũ sau khi đổi: giữ các slug cũ + slug vừa bị thay, bỏ những slug đang dùng lại */
function history(current, slug, slugEn) {
  if (!current) return [];
  const old = new Set([...(current.oldSlugs ?? []), current.slug, current.slugEn].filter(Boolean));
  old.delete(slug);
  old.delete(slugEn);
  return [...old];
}

/** Sinh slug chưa dùng: base, base-2, base-3... */
async function unique(repo, base, excludeId) {
  let candidate = base;
  for (let i = 2; await takenBy(repo, candidate, excludeId); i++) candidate = `${base}-${i}`;
  return candidate;
}

async function assertFree(repo, value, excludeId) {
  if (await takenBy(repo, value, excludeId))
    throw ApiError.conflict(`Đường dẫn "${value}" đã được dùng — chọn đường dẫn khác`);
}

export const slugService = {
  /**
   * @param repo     productRepository | articleRepository
   * @param input    { slug?, slugEn? } từ form (trống = tự sinh)
   * @param name     { vi, en } tên / tiêu đề
   * @param fallback slug dự phòng khi tên không có ký tự hợp lệ
   * @param current  bản ghi đang sửa (null khi tạo mới)
   */
  async resolve(repo, input, name, fallback, current = null) {
    const id = current?._id ?? null;

    let slug;
    if (input.slug && slugify(input.slug)) {
      slug = slugify(input.slug);
      if (slug !== current?.slug) await assertFree(repo, slug, id);
    } else slug = current?.slug ?? (await unique(repo, slugify(name.vi) || fallback, id));

    let slugEn;
    if (input.slugEn && slugify(input.slugEn)) {
      slugEn = slugify(input.slugEn);
      if (slugEn !== slug && slugEn !== current?.slugEn) await assertFree(repo, slugEn, id);
    } else {
      const base = slugify(name.en);
      slugEn = base ? (base === slug ? slug : await unique(repo, base, id)) : slug;
    }
    return { slug, slugEn, oldSlugs: history(current, slug, slugEn) };
  },
};
