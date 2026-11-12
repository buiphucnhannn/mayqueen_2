import { articleRepository } from "../repositories/article.repository.js";
import { productRepository } from "../repositories/product.repository.js";

// old: đường dẫn cũ → proxy chuyển hướng 308 sang đường dẫn hiện tại
const pair = (d) => ({ vi: d.slug, en: d.slugEn || d.slug, old: d.oldSlugs ?? [] });

/**
 * Đường dẫn đang hiển thị (cặp tiếng Việt / tiếng Anh) — proxy của frontend dùng để:
 *   - trả 404 thật cho URL không tồn tại
 *   - chuyển đúng đường dẫn theo ngôn ngữ khi khách đổi VI ↔ EN
 */
export const catalogService = {
  async slugs() {
    const [products, articles] = await Promise.all([
      productRepository.find({ isActive: true }, { select: "slug slugEn oldSlugs" }),
      articleRepository.find({ isPublished: true }, { select: "slug slugEn oldSlugs" }),
    ]);
    return { products: products.map(pair), articles: articles.map(pair) };
  },
};
