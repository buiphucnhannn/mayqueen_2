import { Product } from "../models/product.model.js";
import { BaseRepository } from "./base.repository.js";

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  /** Tìm theo đường dẫn tiếng Việt hoặc tiếng Anh */
  findBySlug(slug, { activeOnly = true } = {}) {
    return this.model
      .findOne({ $or: [{ slug }, { slugEn: slug }], ...(activeOnly && { isActive: true }) })
      .lean();
  }

  async maxSortOrder() {
    const last = await this.model.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
    return last?.sortOrder ?? 0;
  }

  /** Gán sortOrder = vị trí (1..n) theo thứ tự id truyền vào */
  reorder(ids) {
    return this.model.bulkWrite(
      ids.map((_id, i) => ({
        updateOne: { filter: { _id }, update: { $set: { sortOrder: i + 1 } } },
      })),
    );
  }

  /** Gói giá của nhiều sản phẩm theo _id (kể cả đã ẩn) — bổ sung thành phần gói cho đơn cũ */
  findOptionsByIds(ids) {
    return this.model
      .find({ _id: { $in: ids } })
      .select("options")
      .lean();
  }

  /** Tên + gói của mọi sản phẩm → đơn vị kho (lọ / hộp) cho "Tổng cần chuẩn bị" trong email báo đơn */
  findPackUnitsSource() {
    return this.model.find({}).select("name options.label options.note").lean();
  }

  /** Lấy nhiều sản phẩm theo slug 1 lần (dùng khi tính giá đơn hàng) */
  findActiveBySlugs(slugs) {
    return this.model.find({ slug: { $in: slugs }, isActive: true }).lean();
  }

  upsertBySlug(slug, data) {
    return this.model
      .findOneAndUpdate({ slug }, data, {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      })
      .lean();
  }
}

export const productRepository = new ProductRepository();
