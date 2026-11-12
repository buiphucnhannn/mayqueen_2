import { audit } from "../config/logger.js";
import { productService } from "../services/product.service.js";
import { getPagination } from "../utils/pagination.js";
import { created, noContent, ok } from "../utils/response.js";

/**
 * Controller chỉ: đọc request (đã validate) → gọi service → trả response.
 * Không chứa nghiệp vụ, không gọi DB. Lỗi ném ra được Express 5 chuyển tới error middleware.
 */
export const productController = {
  async list(req, res) {
    const { items, meta } = await productService.list(
      req.validated.query,
      getPagination(req.query),
    );
    ok(res, items, meta);
  },

  async manage(req, res) {
    const { items, meta } = await productService.manage(
      req.validated.query,
      getPagination(req.query),
    );
    ok(res, items, meta);
  },

  async getBySlug(req, res) {
    ok(res, await productService.getBySlug(req.validated.params.slug));
  },

  async getById(req, res) {
    ok(res, await productService.getById(req.validated.params.id));
  },

  async create(req, res) {
    const doc = await productService.create(req.validated.body);
    audit(req, "product.create", { id: doc.id, slug: doc.slug });
    created(res, doc);
  },

  async update(req, res) {
    const doc = await productService.update(req.validated.params.id, req.validated.body);
    audit(req, "product.update", { id: doc.id, slug: doc.slug });
    ok(res, doc);
  },

  async setActive(req, res) {
    const doc = await productService.setActive(
      req.validated.params.id,
      req.validated.body.isActive,
    );
    audit(req, "product.active", { id: doc.id, isActive: doc.isActive });
    ok(res, doc);
  },

  async reorder(req, res) {
    await productService.reorder(req.validated.body.ids);
    audit(req, "product.reorder", { count: req.validated.body.ids.length });
    noContent(res);
  },

  async remove(req, res) {
    await productService.remove(req.validated.params.id);
    audit(req, "product.delete", { id: req.validated.params.id });
    noContent(res);
  },
};
