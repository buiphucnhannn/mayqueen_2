import { articleRepository } from "../repositories/article.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPageMeta } from "../utils/pagination.js";
import { searchRegex } from "../utils/search.js";
import { assertNotStale } from "../utils/stale.js";
import { categoryService } from "./category.service.js";
import { mediaService } from "./media.service.js";
import { slugService } from "./slug.service.js";
import { toDTO } from "../utils/serialize.js";

const SORT = { publishedAt: -1, createdAt: -1 };

// banner gửi null = gỡ ảnh → $unset thay vì lưu null
function toUpdate(data) {
  const $unset = {};
  for (const k of ["banner"]) {
    if (data[k] == null) {
      delete data[k];
      $unset[k] = 1;
    }
  }
  return Object.keys($unset).length ? { ...data, $unset } : data;
}

/** Nghiệp vụ bài viết "Sống đẹp" */
export const articleService = {
  /** Public: bài đã đăng, mới nhất trước (bài đầu tiên = bài nổi bật) */
  async list({ category }, pagination) {
    const filter = { isPublished: true, ...(category && { category }) };
    const { items, total } = await articleRepository.paginate(filter, {
      ...pagination,
      sort: SORT,
    });
    return { items: toDTO(items), meta: buildPageMeta(pagination, total) };
  },

  async manage({ category, status, q }, pagination) {
    const filter = {
      ...(category && { category }),
      ...(status && { isPublished: status === "published" }),
      ...(q && {
        $or: [
          { "title.vi": searchRegex(q) },
          { "title.en": searchRegex(q) },
          { slug: searchRegex(q) },
          { slugEn: searchRegex(q) },
        ],
      }),
    };
    const { items, total } = await articleRepository.paginate(filter, {
      ...pagination,
      sort: SORT,
      select: "-body", // danh sách không cần nội dung
    });
    return { items: toDTO(items), meta: buildPageMeta(pagination, total) };
  },

  async getBySlug(slug) {
    const article = await articleRepository.findPublishedBySlug(slug);
    if (!article) throw ApiError.notFound("Article not found");
    return toDTO(article);
  },

  async getById(id) {
    const article = await articleRepository.findById(id);
    if (!article) throw ApiError.notFound("Article not found");
    return toDTO(article);
  },

  /** Tạo mới: đường dẫn VI/EN từ tiêu đề, ngày đăng = lúc tạo */
  async create(data) {
    await categoryService.assertExists("article", data.category);
    const slugs = await slugService.resolve(articleRepository, data, data.title, "bai-viet");
    // ảnh tùy chọn để trống (null) → không lưu trường đó
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v != null));
    const article = await articleRepository.create({
      ...clean,
      ...slugs,
      publishedAt: new Date(),
    });
    return article.toJSON();
  },

  async update(id, { expectedUpdatedAt, ...data }) {
    await categoryService.assertExists("article", data.category);
    const current = await articleRepository.findById(id);
    if (!current) throw ApiError.notFound("Article not found");
    assertNotStale(current, expectedUpdatedAt);
    const slugs = await slugService.resolve(
      articleRepository,
      data,
      data.title,
      "bai-viet",
      current,
    );
    const article = await articleRepository.updateById(
      id,
      toUpdate({
        ...data,
        ...slugs,
        // bản nháp → đăng: ngày đăng là lúc bấm đăng
        ...(data.isPublished && !current.isPublished && { publishedAt: new Date() }),
      }),
    );
    mediaService.releaseLater(current, article); // ảnh bìa / ảnh trong bài bị thay → dọn (chạy nền)
    return toDTO(article);
  },

  async remove(id) {
    const article = await articleRepository.deleteById(id);
    if (!article) throw ApiError.notFound("Article not found");
    mediaService.releaseLater(article); // xóa bài → dọn ảnh không còn chỗ nào dùng
  },
};
