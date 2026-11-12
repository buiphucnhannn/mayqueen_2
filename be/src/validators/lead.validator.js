import { z } from "zod";
import { LEAD_STATUSES } from "../models/lead.model.js";
import {
  consent,
  pageQuery,
  personName,
  phone,
  plainText,
  searchQuery,
} from "./common.validator.js";

// Khớp payload gửi từ fe/src/components/forms/ConsultForm.jsx
export const createLeadSchema = z.object({
  name: personName,
  phone,
  goal: plainText(120).optional().default(""),
  note: plainText(1000).optional().default(""),
  source: plainText(60).optional(),
  lang: z.enum(["vi", "en"]).optional().default("vi"),
  consent,
  // Bẫy bot: ô ẩn, người thật không thấy nên luôn để trống (xem lead.controller.js)
  website: z.string().max(500).optional().default(""),
});

export const listLeadsQuery = pageQuery.extend({
  status: z.enum(LEAD_STATUSES).optional(),
  q: searchQuery, // tên / SĐT
});

export const updateLeadStatusSchema = z.object({ status: z.enum(LEAD_STATUSES) });
