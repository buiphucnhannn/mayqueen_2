/**
 * Repository = lớp DUY NHẤT nói chuyện với MongoDB (Mongoose).
 * Service chỉ gọi repository → đổi DB / thêm cache sau này không phải sửa logic nghiệp vụ.
 * Các repository cụ thể kế thừa lớp này và thêm truy vấn riêng.
 */
export class BaseRepository {
  /** @param {import("mongoose").Model} model */
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id, { lean = true } = {}) {
    return this.model.findById(id).lean(lean);
  }

  findOne(filter, { lean = true } = {}) {
    return this.model.findOne(filter).lean(lean);
  }

  /** Danh sách có phân trang: trả { items, total } */
  async paginate(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 }, select } = {}) {
    const [items, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).select(select).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total };
  }

  find(filter = {}, { sort, select } = {}) {
    return this.model.find(filter).sort(sort).select(select).lean();
  }

  updateById(id, update) {
    return this.model
      .findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true })
      .lean();
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id).lean();
  }

  exists(filter) {
    return this.model.exists(filter);
  }

  /** Đếm số bản ghi theo từng giá trị của 1 trường: { pending: 3, confirmed: 5, ... } */
  async countBy(field) {
    const rows = await this.model.aggregate([{ $group: { _id: "$" + field, n: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [r._id, r.n]));
  }
}
