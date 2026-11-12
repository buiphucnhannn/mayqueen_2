import { siteConfig } from "@/config/site";
import { policies } from "@/data/policies";
import { href } from "@/i18n";
import { getArticles, getProducts } from "@/lib/catalog";

// Mỗi trang có bản tiếng Việt + tiếng Anh (khai báo alternates để Google hiểu cặp ngôn ngữ, kèm x-default).
// Sản phẩm / bài viết có đường dẫn riêng từng ngôn ngữ (urlSlug.vi / urlSlug.en).
// lastmod = ngày SỬA THẬT (Google bỏ qua lastmod nếu thường xuyên sai): sản phẩm / bài viết lấy updatedAt từ Admin,
// trang danh sách lấy ngày mới nhất trong danh sách, trang chủ = mới nhất của toàn bộ nội dung.
// Trang chính sách (nội dung viết sẵn trong code, ít đổi) → không ghi lastmod thay vì ghi ngày đoán.

const same = (path) => ({ vi: path, en: path });
const latest = (dates) => {
  const ts = dates.map((d) => Date.parse(d)).filter(Number.isFinite);
  return ts.length ? new Date(Math.max(...ts)).toISOString() : undefined;
};

export default async function sitemap() {
  const [products, articles] = await Promise.all([getProducts(), getArticles()]);
  const productsMod = latest(products.map((p) => p.updatedAt));
  const articlesMod = latest(articles.map((a) => a.updatedAt));
  const pages = [
    { paths: same("/"), priority: 1, lastModified: latest([productsMod, articlesMod]) },
    { paths: same("/san-pham"), priority: 0.9, lastModified: productsMod },
    ...products.map((p) => ({
      paths: { vi: `/san-pham/${p.urlSlug.vi}`, en: `/san-pham/${p.urlSlug.en}` },
      priority: 0.9,
      lastModified: latest([p.updatedAt]),
    })),
    { paths: same("/song-dep"), priority: 0.7, lastModified: articlesMod },
    ...articles.map((a) => ({
      paths: { vi: `/song-dep/${a.urlSlug.vi}`, en: `/song-dep/${a.urlSlug.en}` },
      priority: 0.6,
      lastModified: latest([a.updatedAt]),
      viOnly: !a.hasEn, // chưa có bản tiếng Anh → chỉ đưa bản tiếng Việt
    })),
    ...policies.map((p) => ({
      paths: { vi: `/chinh-sach/${p.urlSlug.vi}`, en: `/chinh-sach/${p.urlSlug.en}` },
      priority: 0.3,
    })),
  ];

  const languages = (paths, viOnly) => ({
    vi: siteConfig.url + href("vi", paths.vi),
    ...(!viOnly && { en: siteConfig.url + href("en", paths.en) }),
    "x-default": siteConfig.url + href("vi", paths.vi),
  });
  return pages.flatMap(({ paths, priority, lastModified, viOnly }) =>
    (viOnly ? ["vi"] : ["vi", "en"]).map((lang) => ({
      url: siteConfig.url + href(lang, paths[lang]),
      ...(lastModified && { lastModified }),
      priority: lang === "vi" ? priority : priority * 0.9,
      alternates: { languages: languages(paths, viOnly) },
    })),
  );
}
