import { productRepository } from "../repositories/product.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPageMeta } from "../utils/pagination.js";
import { searchRegex } from "../utils/search.js";
import { assertNotStale } from "../utils/stale.js";
import { categoryService } from "./category.service.js";
import { mediaService } from "./media.service.js";
import { slugService } from "./slug.service.js";
import { toDTO } from "../utils/serialize.js";

const SORT = { sortOrder: 1, createdAt: 1 };

/**
 * Mã gói (optionId) do SERVER cấp — giỏ hàng & đơn hàng tra giá theo slug + optionId nên mã phải bất biến:
 * - Gói đã có (mã trùng gói hiện tại của sản phẩm) → giữ nguyên mã.
 * - Gói mới (mã client gửi không thuộc sản phẩm) → cấp số kế tiếp CHƯA TỪNG dùng (optionSeq chỉ tăng).
 *   → Xóa gói #2 rồi thêm gói mới sẽ nhận #3, không phải #2: khách còn giữ gói #2 cũ trong giỏ sẽ bị báo
 *   "sản phẩm không hợp lệ" thay vì bị tính nhầm sang gói khác giá.
 * Sản phẩm cũ chưa có optionSeq → lấy mã lớn nhất hiện có làm mốc.
 */
function assignOptionIds(options, current) {
  const existing = new Set((current?.options ?? []).map((o) => o.optionId));
  let seq = Math.max(
    current?.optionSeq ?? 0,
    ...[...existing].map(Number).filter(Number.isFinite),
    0,
  );
  const withIds = options.map((o) =>
    existing.has(o.optionId) ? o : { ...o, optionId: String(++seq) },
  );
  return { options: withIds, optionSeq: seq };
}

/** Nghiệp vụ sản phẩm. Không gọi Mongoose trực tiếp — chỉ đi qua repository. */
export const productService = {
  /** Public: chỉ sản phẩm đang bán */
  async list({ category }, pagination) {
    const filter = { isActive: true, ...(category && { category }) };
    const { items, total } = await productRepository.paginate(filter, {
      ...pagination,
      sort: SORT,
    });
    return { items: toDTO(items), meta: buildPageMeta(pagination, total) };
  },

  /** Quản trị: cả sản phẩm đang ẩn, tìm theo tên / slug */
  async manage({ category, status, q }, pagination) {
    const rx = q && searchRegex(q);
    const filter = {
      ...(category && { category }),
      ...(status && { isActive: status === "active" }),
      ...(rx && { $or: [{ "name.vi": rx }, { "name.en": rx }, { slug: rx }, { slugEn: rx }] }),
    };
    const { items, total } = await productRepository.paginate(filter, {
      ...pagination,
      sort: SORT,
    });
    return { items: toDTO(items), meta: buildPageMeta(pagination, total) };
  },

  async getBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw ApiError.notFound("Product not found");
    return toDTO(product);
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound("Product not found");
    return toDTO(product);
  },

  /** Tạo mới: đường dẫn VI/EN sinh từ tên, thứ tự = cuối danh sách */
  async create(data) {
    await categoryService.assertExists("product", data.category);
    const slugs = await slugService.resolve(productRepository, data, data.name, "san-pham");
    const sortOrder = (await productRepository.maxSortOrder()) + 1;
    const product = await productRepository.create({
      ...data,
      ...slugs,
      ...assignOptionIds(data.options),
      sortOrder,
    });
    return product.toJSON();
  },

  async update(id, { expectedUpdatedAt, ...data }) {
    await categoryService.assertExists("product", data.category);
    const current = await productRepository.findById(id);
    if (!current) throw ApiError.notFound("Product not found");
    assertNotStale(current, expectedUpdatedAt);
    const slugs = await slugService.resolve(
      productRepository,
      data,
      data.name,
      "san-pham",
      current,
    );
    const product = await productRepository.updateById(id, {
      ...data,
      ...slugs,
      ...assignOptionIds(data.options, current),
    });
    mediaService.releaseLater(current, product); // ảnh bị thay / gỡ → dọn khỏi Cloudinary (chạy nền)
    return toDTO(product);
  },

  /** Lưu thứ tự mới (kéo-thả / lên đầu / xuống cuối trong bảng quản trị): ids = toàn bộ sản phẩm */
  async reorder(ids) {
    const all = await productRepository.find({}, { select: "_id" });
    const known = new Set(all.map((p) => String(p._id)));
    if (ids.length !== known.size || !ids.every((id) => known.has(id)))
      throw ApiError.conflict("Danh sách sản phẩm đã thay đổi — tải lại trang rồi sắp xếp lại");
    await productRepository.reorder(ids); // đánh lại 1..n
  },

  /** Công tắc "Đang bán / Ẩn" trong bảng: chỉ đổi isActive → không ghi đè nội dung đang được sửa ở tab khác */
  async setActive(id, isActive) {
    const product = await productRepository.updateById(id, { isActive });
    if (!product) throw ApiError.notFound("Product not found");
    return toDTO(product);
  },

  async remove(id) {
    const product = await productRepository.deleteById(id);
    if (!product) throw ApiError.notFound("Product not found");
    mediaService.releaseLater(product); // xóa sản phẩm → dọn ảnh không còn chỗ nào dùng
  },
};
