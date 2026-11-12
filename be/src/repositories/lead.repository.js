import { Lead } from "../models/lead.model.js";
import { BaseRepository } from "./base.repository.js";

class LeadRepository extends BaseRepository {
  constructor() {
    super(Lead);
  }

  /** Lead gần nhất của 1 số điện thoại trong khoảng thời gian (chống gửi trùng) */
  findRecentByPhone(phone, sinceMs) {
    return this.model
      .findOne({ phone, createdAt: { $gte: new Date(Date.now() - sinceMs) } })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const leadRepository = new LeadRepository();
