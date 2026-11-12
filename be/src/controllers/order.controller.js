import { audit } from "../config/logger.js";
import { orderService } from "../services/order.service.js";
import { getPagination } from "../utils/pagination.js";
import { normalizePhone } from "../utils/phone.js";
import { created, noContent, ok } from "../utils/response.js";
import { consentRecord } from "../validators/common.validator.js";

export const orderController = {
  async create(req, res) {
    const { website, consent, ...rest } = req.validated.body;
    const data = { ...rest, ...(consent && { consent: consentRecord(consent) }) };
    // Bẫy bot: ô ẩn bị điền. Đơn hàng = tiền thật → KHÔNG vứt bỏ (phòng trình duyệt / trình quản lý mật khẩu tự
    // điền nhầm cho khách thật): vẫn lưu + báo admin như thường nhưng gắn ghi chú "nghi bot" để gọi xác nhận.
    // (Form tư vấn thì trả "thành công" giả và bỏ qua — xem lead.controller.js)
    if (website) audit(req, "security.honeypot", { form: "order" }, "warn");
    created(res, await orderService.create({ ...data, suspected: Boolean(website) }));
  },

  async track(req, res) {
    ok(res, await orderService.track(req.validated.params.code, normalizePhone(req.query.phone)));
  },

  async list(req, res) {
    const { items, meta } = await orderService.list(req.validated.query, getPagination(req.query));
    ok(res, items, meta);
  },

  async getById(req, res) {
    ok(res, await orderService.getById(req.validated.params.id));
  },

  async stats(_req, res) {
    ok(res, await orderService.stats());
  },

  async update(req, res) {
    const order = await orderService.update(req.validated.params.id, req.validated.body);
    // chỉ ghi trạng thái + có/không ghi chú (không chép nội dung ghi chú, có thể chứa thông tin khách)
    audit(req, "order.update", {
      id: order.id,
      code: order.code,
      status: req.validated.body.status,
      noteChanged: req.validated.body.adminNote !== undefined,
    });
    ok(res, order);
  },

  async remove(req, res) {
    const order = await orderService.remove(req.validated.params.id);
    audit(req, "order.delete", { id: req.validated.params.id, code: order.code });
    noContent(res);
  },
};
