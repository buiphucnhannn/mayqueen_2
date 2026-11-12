import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { translateService } from "../services/translate.service.js";
import { ok } from "../utils/response.js";

const router = Router();

const translateSchema = z.object({
  texts: z.array(z.string().max(20_000)).min(1).max(300),
  from: z.enum(["vi", "en"]).default("vi"),
  to: z.enum(["vi", "en"]).default("en"),
});

// POST /translate  { texts: [...], from: "vi", to: "en" } → [...]  (chỉ Admin)
router.post(
  "/",
  requireAdmin,
  limiter({ windowMs: 60_000, limit: 30, message: "Dịch quá nhiều lần, vui lòng chờ 1 phút" }),
  validate({ body: translateSchema }),
  async (req, res) => {
    const { texts, from, to } = req.validated.body;
    ok(res, await translateService.translate(texts, from, to));
  },
);

export default router;
