import { Category } from "../models/category.model.js";
import { BaseRepository } from "./base.repository.js";

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  listByType(type) {
    return this.model.find({ type }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  }

  async maxSortOrder(type) {
    const last = await this.model
      .findOne({ type })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
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

  upsertBySlug(type, slug, data) {
    return this.model
      .findOneAndUpdate({ type, slug }, data, {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      })
      .lean();
  }
}

export const categoryRepository = new CategoryRepository();
