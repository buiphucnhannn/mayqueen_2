import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";
import { catalogService } from "../services/catalog.service.js";
import { ok } from "../utils/response.js";
import articleRoutes from "./article.routes.js";
import categoryRoutes from "./category.routes.js";
import translateRoutes from "./translate.routes.js";
import authRoutes from "./auth.routes.js";
import leadRoutes from "./lead.routes.js";
import orderRoutes from "./order.routes.js";
import productRoutes from "./product.routes.js";
import uploadRoutes from "./upload.routes.js";

/** Gom toàn bộ route của API phiên bản 1 — gắn tại /api/v1 trong app.js */
const router = Router();

const noStore = (_req, res, next) => {
  res.set("Cache-Control", "no-store"); // phản hồi đăng nhập không bao giờ được cache
  next();
};

router.get("/health", healthController.check);
router.use("/auth", noStore, authRoutes);
router.get("/slugs", async (_req, res) => ok(res, await catalogService.slugs()));
router.use("/products", productRoutes);
router.use("/articles", articleRoutes);
router.use("/categories", categoryRoutes);
router.use("/translate", translateRoutes);
router.use("/orders", orderRoutes);
router.use("/leads", leadRoutes);
router.use("/uploads", uploadRoutes);

export default router;
