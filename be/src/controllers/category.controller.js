import { audit } from "../config/logger.js";
import { categoryService } from "../services/category.service.js";
import { created, noContent, ok } from "../utils/response.js";

export const categoryController = {
  async list(req, res) {
    ok(res, await categoryService.list(req.validated.query.type));
  },

  async manage(req, res) {
    ok(res, await categoryService.manage(req.validated.query.type));
  },

  async create(req, res) {
    const category = await categoryService.create(req.validated.body);
    audit(req, "category.create", { id: category.id, type: category.type, slug: category.slug });
    created(res, category);
  },

  async update(req, res) {
    const category = await categoryService.update(req.validated.params.id, req.validated.body);
    audit(req, "category.update", { id: category.id, type: category.type, slug: category.slug });
    ok(res, category);
  },

  async reorder(req, res) {
    const { type, ids } = req.validated.body;
    await categoryService.reorder(type, ids);
    audit(req, "category.reorder", { type, count: ids.length });
    noContent(res);
  },

  async remove(req, res) {
    const category = await categoryService.remove(req.validated.params.id);
    audit(req, "category.delete", { type: category.type, slug: category.slug });
    noContent(res);
  },
};
