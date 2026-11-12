import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  categoryTypeQuery,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import { idParam } from "../validators/common.validator.js";

const router = Router();

// Public: GET /categories?type=product|article
router.get("/", validate({ query: categoryTypeQuery }), categoryController.list);

// Admin
router.get(
  "/manage",
  requireAdmin,
  validate({ query: categoryTypeQuery }),
  categoryController.manage,
);
router.post("/", requireAdmin, validate({ body: createCategorySchema }), categoryController.create);
router.put(
  "/order",
  requireAdmin,
  validate({ body: reorderCategoriesSchema }),
  categoryController.reorder,
);
router.patch(
  "/:id",
  requireAdmin,
  validate({ params: idParam, body: updateCategorySchema }),
  categoryController.update,
);
router.delete("/:id", requireAdmin, validate({ params: idParam }), categoryController.remove);

export default router;
