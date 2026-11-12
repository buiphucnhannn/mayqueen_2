import { logger } from "../config/logger.js";
import { leadRepository } from "../repositories/lead.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPageMeta } from "../utils/pagination.js";
import { searchRegex } from "../utils/search.js";
import { toDTO } from "../utils/serialize.js";
import { notifyService } from "./notify.service.js";

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // cùng SĐT gửi lại trong 10 phút → gộp vào yêu cầu cũ
const EDITABLE = ["name", "goal", "note"];

/** Ghi nhận đã báo admin thành công → lần gửi lại sau không báo bù nữa */
const markNotified = (id) =>
  leadRepository.updateById(id, { notifiedAt: new Date() }).catch(() => {});

export const leadService = {
  /**
   * Khách gửi yêu cầu tư vấn. Cùng SĐT gửi lại trong 10 phút (bấm 2 lần, sửa lại form...) KHÔNG tạo bản ghi
   * mới — admin không phải gọi 2 lần cho 1 người:
   *  - nội dung khác (đổi tên / nhu cầu / ghi chú) → cập nhật yêu cầu cũ + email "Khách cập nhật yêu cầu"
   *  - y hệt nhưng lần trước CHƯA báo được (mạng lỗi, chưa cấu hình) → gửi bù email
   *  - y hệt và đã báo rồi → bỏ qua (chống spam hộp thư)
   */
  async create(data) {
    const recent = await leadRepository.findRecentByPhone(data.phone, DUPLICATE_WINDOW_MS);
    if (recent) {
      const id = String(recent._id);
      const changed = EDITABLE.filter((k) => (data[k] ?? "") !== (recent[k] ?? ""));
      if (changed.length) {
        const lead = await leadRepository.updateById(
          id,
          Object.fromEntries(changed.map((k) => [k, data[k] ?? ""])),
        );
        logger.info(
          { event: "lead.updated", id, changed },
          "[lead] khách gửi lại với nội dung mới — đã cập nhật yêu cầu cũ",
        );
        notifyService.newLead(lead, { updated: true, onSent: () => markNotified(id) });
      } else if (!recent.notifiedAt) {
        logger.info(
          { event: "lead.renotify", id },
          "[lead] khách gửi lại, lần trước chưa báo được admin — gửi bù email",
        );
        notifyService.newLead(recent, { onSent: () => markNotified(id) });
      } else {
        logger.info(
          { event: "lead.duplicate", id },
          "[lead] khách gửi lại y hệt trong 10 phút — đã báo admin trước đó, bỏ qua",
        );
      }
      return { id, duplicate: true };
    }

    const lead = await leadRepository.create(data);
    notifyService.newLead(lead.toObject(), { onSent: () => markNotified(lead.id) }); // email admin (chạy nền)
    return { id: lead.id, duplicate: false };
  },

  async list({ status, q }, pagination) {
    const rx = q && searchRegex(q);
    const filter = { ...(status && { status }), ...(rx && { $or: [{ name: rx }, { phone: rx }] }) };
    const { items, total } = await leadRepository.paginate(filter, pagination);
    return { items: toDTO(items), meta: buildPageMeta(pagination, total) };
  },

  async stats() {
    const byStatus = await leadRepository.countBy("status");
    const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
    return { total, byStatus };
  },

  async updateStatus(id, status) {
    const lead = await leadRepository.updateById(id, { status });
    if (!lead) throw ApiError.notFound("Lead not found");
    return toDTO(lead);
  },

  async remove(id) {
    const lead = await leadRepository.deleteById(id);
    if (!lead) throw ApiError.notFound("Lead not found");
  },
};
