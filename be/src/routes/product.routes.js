import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParam } from "../validators/common.validator.js";
import {
  createProductSchema,
  listProductsQuery,
  manageProductsQuery,
  reorderSchema,
  setActiveSchema,
  slugParam,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = Router();

// Admin (đặt TRƯỚC "/:slug" để "manage" không bị hiểu là slug)
router.get(
  "/manage",
  requireAdmin,
  validate({ query: manageProductsQuery }),
  productController.manage,
);
router.get("/manage/:id", requireAdmin, validate({ params: idParam }), productController.getById);
router.post("/", requireAdmin, validate({ body: createProductSchema }), productController.create);
router.put("/order", requireAdmin, validate({ body: reorderSchema }), productController.reorder); // trước "/:id"
router.put(
  "/:id",
  requireAdmin,
  validate({ params: idParam, body: updateProductSchema }),
  productController.update,
);
router.patch(
  "/:id/active",
  requireAdmin,
  validate({ params: idParam, body: setActiveSchema }),
  productController.setActive,
);
router.delete("/:id", requireAdmin, validate({ params: idParam }), productController.remove);

// Public
router.get("/", validate({ query: listProductsQuery }), productController.list);
router.get("/:slug", validate({ params: slugParam }), productController.getBySlug);

export default router;
