import { audit } from "../config/logger.js";
import { articleService } from "../services/article.service.js";
import { getPagination } from "../utils/pagination.js";
import { created, noContent, ok } from "../utils/response.js";

export const articleController = {
  async list(req, res) {
    const { items, meta } = await articleService.list(
      req.validated.query,
      getPagination(req.query),
    );
    ok(res, items, meta);
  },

  async manage(req, res) {
    const { items, meta } = await articleService.manage(
      req.validated.query,
      getPagination(req.query),
    );
    ok(res, items, meta);
  },

  async getBySlug(req, res) {
    ok(res, await articleService.getBySlug(req.validated.params.slug));
  },

  async getById(req, res) {
    ok(res, await articleService.getById(req.validated.params.id));
  },

  async create(req, res) {
    const doc = await articleService.create(req.validated.body);
    audit(req, "article.create", { id: doc.id, slug: doc.slug });
    created(res, doc);
  },

  async update(req, res) {
    const doc = await articleService.update(req.validated.params.id, req.validated.body);
    audit(req, "article.update", { id: doc.id, slug: doc.slug });
    ok(res, doc);
  },

  async remove(req, res) {
    await articleService.remove(req.validated.params.id);
    audit(req, "article.delete", { id: req.validated.params.id });
    noContent(res);
  },
};
