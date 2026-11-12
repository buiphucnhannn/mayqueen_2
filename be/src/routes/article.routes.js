import { Router } from "express";
import { articleController } from "../controllers/article.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  articleSchema,
  updateArticleSchema,
  listArticlesQuery,
  manageArticlesQuery,
} from "../validators/article.validator.js";
import { idParam } from "../validators/common.validator.js";
import { slugParam } from "../validators/product.validator.js";

const router = Router();

// Admin (đặt TRƯỚC "/:slug")
router.get(
  "/manage",
  requireAdmin,
  validate({ query: manageArticlesQuery }),
  articleController.manage,
);
router.get("/manage/:id", requireAdmin, validate({ params: idParam }), articleController.getById);
router.post("/", requireAdmin, validate({ body: articleSchema }), articleController.create);
router.put(
  "/:id",
  requireAdmin,
  validate({ params: idParam, body: updateArticleSchema }),
  articleController.update,
);
router.delete("/:id", requireAdmin, validate({ params: idParam }), articleController.remove);

// Public
router.get("/", validate({ query: listArticlesQuery }), articleController.list);
router.get("/:slug", validate({ params: slugParam }), articleController.getBySlug);

export default router;
