import { randomBytes } from "node:crypto";
import { audit } from "../config/logger.js";
import { leadService } from "../services/lead.service.js";
import { getPagination } from "../utils/pagination.js";
import { created, noContent, ok } from "../utils/response.js";
import { consentRecord } from "../validators/common.validator.js";

export const leadController = {
  async create(req, res) {
    const { website, consent, ...rest } = req.validated.body;
    const data = { ...rest, ...(consent && { consent: consentRecord(consent) }) };
    // Bot tự điền mọi ô (kể cả ô ẩn "website") → trả "thành công" giả, KHÔNG lưu, để bot không dò ra luật chặn
    if (website) {
      audit(req, "security.honeypot", { form: "lead" }, "warn");
      return created(res, { id: randomBytes(12).toString("hex"), duplicate: false });
    }
    created(res, await leadService.create(data));
  },

  async list(req, res) {
    const { items, meta } = await leadService.list(req.validated.query, getPagination(req.query));
    ok(res, items, meta);
  },

  async stats(_req, res) {
    ok(res, await leadService.stats());
  },

  async updateStatus(req, res) {
    const lead = await leadService.updateStatus(req.validated.params.id, req.validated.body.status);
    audit(req, "lead.status", { id: lead.id, status: lead.status });
    ok(res, lead);
  },

  async remove(req, res) {
    await leadService.remove(req.validated.params.id);
    audit(req, "lead.delete", { id: req.validated.params.id });
    noContent(res);
  },
};
