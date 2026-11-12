import { articleRepository } from "../repositories/article.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { toDTO } from "../utils/serialize.js";
import { slugify } from "../utils/slugify.js";

const itemRepo = { product: productRepository, article: articleRepository };
const itemLabel = { product: "sản phẩm", article: "bài viết" };

/** Danh mục sản phẩm / chuyên mục bài viết */
export const categoryService = {
  /** Public + Admin: danh mục theo thứ tự hiển thị */
  async list(type) {
    return toDTO(await categoryRepository.listByType(type));
  },

  /** Admin: kèm số sản phẩm / bài viết đang thuộc từng danh mục */
  async manage(type) {
    const [items, counts] = await Promise.all([
      categoryRepository.listByType(type),
      itemRepo[type].countBy("category"),
    ]);
    return toDTO(items).map((c) => ({ ...c, count: counts[c.slug] ?? 0 }));
  },

  async create({ type, name }) {
    const base = slugify(name.vi) || "danh-muc";
    let slug = base;
    for (let i = 2; await categoryRepository.exists({ type, slug }); i++) slug = `${base}-${i}`;
    const sortOrder = (await categoryRepository.maxSortOrder(type)) + 1;
    const category = await categoryRepository.create({ type, slug, name, sortOrder });
    return { ...category.toJSON(), count: 0 };
  },

  async update(id, data) {
    const category = await categoryRepository.updateById(id, data);
    if (!category) throw ApiError.notFound("Category not found");
    return toDTO(category);
  },

  /** Lưu thứ tự mới (kéo-thả trong popup quản lý) */
  async reorder(type, ids) {
    const all = await categoryRepository.listByType(type);
    const known = new Set(all.map((c) => String(c._id)));
    if (ids.length !== known.size || !ids.every((id) => known.has(id)))
      throw ApiError.conflict("Danh sách danh mục đã thay đổi — đóng popup rồi mở lại để sắp xếp");
    await categoryRepository.reorder(ids);
  },

  /** Không xóa danh mục đang có sản phẩm / bài viết (tránh nội dung "mồ côi" trên website) */
  async remove(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound("Category not found");
    const used = (await itemRepo[category.type].countBy("category"))[category.slug] ?? 0;
    if (used)
      throw ApiError.conflict(
        `Danh mục đang có ${used} ${itemLabel[category.type]} — chuyển chúng sang danh mục khác trước khi xóa`,
      );
    await categoryRepository.deleteById(id);
    return category;
  },

  /** Dùng khi lưu sản phẩm / bài viết: chỉ nhận danh mục đang có */
  async assertExists(type, slug) {
    if (!(await categoryRepository.exists({ type, slug })))
      throw ApiError.unprocessable("Danh mục không tồn tại — chọn lại danh mục", [
        { field: "body.category", message: "Danh mục không tồn tại" },
      ]);
  },
};
