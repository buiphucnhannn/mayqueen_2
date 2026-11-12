import { cacheLife, cacheTag } from "next/cache";
import { BACKEND_URL, backendHeaders } from "@/config/urls.mjs";
import { articleBannerFallback } from "@/data/images";

/**
 * Dữ liệu sản phẩm + bài viết lấy từ backend (be/) — quản lý trong trang Admin.
 * - Cache theo tag "products" / "articles": Admin lưu xong gọi updateTag (lib/revalidate.js) → web cập nhật ngay.
 * - Chuyển về đúng cấu trúc các component đang dùng (giống data tĩnh cũ):
 *   chuỗi song ngữ { vi, en } (bản EN để trống → dùng bản VI), ảnh = URL, option.id = optionId.
 * Chỉ chạy ở server (Server Components, sitemap, metadata).
 */
const API = `${BACKEND_URL}/api/v1`;

/**
 * Lúc BUILD (Vercel), backend có thể chưa sẵn sàng: 1 lần push deploy CẢ Vercel lẫn Render cùng lúc → Vercel
 * gọi sang đúng lúc Render đang khởi động lại bản mới (hoặc đang "ngủ") → build thất bại.
 * → Khi build: lỗi mạng / 5xx thì chờ rồi thử lại (5s, 15s, 30s, 60s ≈ 2 phút). Lúc chạy thật không chờ lâu.
 */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const RETRY_DELAYS = IS_BUILD ? [5_000, 15_000, 30_000, 60_000] : [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  for (let attempt = 0; ; attempt++) {
    try {
      // Render gói free "ngủ" sau 15 phút → lần gọi đầu có thể mất ~50s
      const res = await fetch(API + path, {
        headers: backendHeaders(),
        signal: AbortSignal.timeout(70_000),
      });
      if (res.status >= 500) throw Object.assign(new Error(`HTTP ${res.status}`), { retry: true });
      if (!res.ok) throw new Error(`Backend ${path} → HTTP ${res.status}`);
      return (await res.json()).data;
    } catch (err) {
      // chỉ thử lại lỗi tạm thời (mạng, hết giờ chờ, 5xx) — lỗi 4xx là lỗi thật, báo ngay
      const transient = err.retry || err.name === "TimeoutError" || err.name === "TypeError";
      if (!transient || attempt >= RETRY_DELAYS.length) throw err;
      console.warn(
        `[mayqueen] Backend chưa sẵn sàng (${path}: ${err.message}) — thử lại sau ${RETRY_DELAYS[attempt] / 1000}s`,
      );
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

/** { vi, en } → luôn đủ 2 khóa (localize() nhận diện chuỗi song ngữ theo đúng 2 khóa này) */
const loc = (v) => ({ vi: v?.vi ?? "", en: v?.en || v?.vi || "" });
/** Trường tùy chọn: bản VI trống → undefined (giao diện tự ẩn) */
const optLoc = (v) => (v?.vi ? loc(v) : undefined);

// Ngày đăng theo giờ Việt Nam → "YYYY-MM-DD" (formatDate ở giao diện nhận dạng này)
const vnDate = (iso) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

/**
 * Nội dung bài (HTML đã lọc ở backend): ảnh Cloudinary → tự chọn định dạng / chất lượng, giới hạn 1400px
 * (vừa khung bài cả màn hình Retina), tải lười khi cuộn tới.
 */
const optimizeHtml = (html = "") =>
  html
    .replace(
      /(https:\/\/res\.cloudinary\.com\/[^"\s]+?\/image\/upload\/)(?!f_auto)/g,
      "$1f_auto,q_auto,c_limit,w_1400/",
    )
    .replace(/<img /g, '<img loading="lazy" decoding="async" ');

/**
 * slug     — mã cố định (tiếng Việt): giỏ hàng, đơn hàng, so sánh nội bộ
 * urlSlug  — { vi, en }: sau localize() thành đường dẫn đúng ngôn ngữ → dùng khi tạo link
 */
const urlSlug = (d) => ({ vi: d.slug, en: d.slugEn || d.slug });

function toProduct(p) {
  return {
    slug: p.slug,
    oldSlugs: p.oldSlugs ?? [], // đường dẫn cũ (Admin đổi tên) → giỏ hàng tự chuyển món hàng sang slug mới
    urlSlug: urlSlug(p),
    category: p.category,
    name: loc(p.name),
    badge: optLoc(p.badge),
    ritual: loc(p.ritual),
    tagline: loc(p.tagline),
    short: loc(p.short),
    description: loc(p.description),
    spec: loc(p.spec),
    benefits: p.benefits.map(loc),
    ingredients: p.ingredients.map((g) => ({ name: loc(g.name), note: loc(g.note) })),
    excipients: optLoc(p.excipients),
    usage: p.usage.map(loc),
    images: p.images.map((i) => i.url),
    updatedAt: p.updatedAt ?? p.createdAt ?? null, // ISO — lastmod trong sitemap
    options: p.options.map((o) => ({
      id: o.optionId,
      label: loc(o.label),
      note: loc(o.note),
      price: o.price,
      ...(o.compareAt && { compareAt: o.compareAt }),
      ...(o.popular && { popular: true }),
    })),
  };
}

function toArticle(a) {
  return {
    slug: a.slug,
    urlSlug: urlSlug(a),
    category: a.category,
    date: vnDate(a.publishedAt),
    publishedAt: a.publishedAt, // ISO — dữ liệu cấu trúc (JSON-LD) + og:article
    updatedAt: a.updatedAt ?? a.publishedAt,
    cover: a.cover.url,
    banner: a.banner?.url ?? articleBannerFallback, // chưa có banner riêng → ảnh banner chung
    title: loc(a.title),
    excerpt: loc(a.excerpt),
    body: { vi: optimizeHtml(a.body?.vi), en: optimizeHtml(a.body?.en || a.body?.vi) },
    // chưa có bản dịch tiếng Anh (trang /en hiện tạm nội dung tiếng Việt) → noindex bản EN, bỏ khỏi sitemap
    hasEn: Boolean(a.body?.en?.replace(/<[^>]*>/g, "").trim()),
  };
}

/** Sản phẩm đang bán, theo thứ tự hiển thị đặt trong Admin */
export async function getProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return (await get("/products?limit=100")).map(toProduct);
}

/** Tìm theo đường dẫn tiếng Việt hoặc tiếng Anh */
export async function getProduct(slug) {
  return (await getProducts()).find((p) => p.slug === slug || p.urlSlug.en === slug) ?? null;
}

/** Bài viết đã đăng, mới nhất trước (bài đầu tiên = bài nổi bật trang "Sống đẹp") */
export async function getArticles() {
  "use cache";
  cacheTag("articles");
  cacheLife("hours");
  return (await get("/articles?limit=100")).map(toArticle);
}

export async function getArticle(slug) {
  return (await getArticles()).find((a) => a.slug === slug || a.urlSlug.en === slug) ?? null;
}

/** Danh mục (sản phẩm / chuyên mục bài viết) quản lý trong Admin — { id: slug, label } */
async function getCategories(type) {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  return (await get(`/categories?type=${type}`)).map((c) => ({ id: c.slug, label: loc(c.name) }));
}

// Tab "Tất cả" đứng đầu bộ lọc ở trang Cửa hàng / Sống đẹp
const ALL = { id: "all", label: { vi: "Tất cả", en: "All" } };
// Chỉ danh mục CÓ nội dung đang hiển thị (sản phẩm đang bán / bài đã đăng) → không có tab lọc bấm vào ra trống
// (danh mục admin vừa tạo, hoặc chỉ chứa mục đang ẩn / nháp, tự ẩn khỏi tab lọc + chân trang).
const withItems = (cats, items) => {
  const used = new Set(items.map((x) => x.category));
  return cats.filter((c) => used.has(c.id));
};
export const getProductCategories = async () => {
  const [cats, products] = await Promise.all([getCategories("product"), getProducts()]);
  return [ALL, ...withItems(cats, products)];
};
export const getArticleCategories = async () => {
  const [cats, articles] = await Promise.all([getCategories("article"), getArticles()]);
  return [ALL, ...withItems(cats, articles)];
};
