import { Article } from "../models/article.model.js";
import { BaseRepository } from "./base.repository.js";

class ArticleRepository extends BaseRepository {
  constructor() {
    super(Article);
  }

  /** Tìm theo đường dẫn tiếng Việt hoặc tiếng Anh */
  findPublishedBySlug(slug) {
    return this.model.findOne({ $or: [{ slug }, { slugEn: slug }], isPublished: true }).lean();
  }

  upsertBySlug(slug, data) {
    return this.model
      .findOneAndUpdate({ slug }, data, {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      })
      .lean();
  }
}

export const articleRepository = new ArticleRepository();
