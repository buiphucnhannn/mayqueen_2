/**
 * Đưa dữ liệu ban đầu (danh mục + 3 sản phẩm + 6 bài viết "Sống đẹp") vào MongoDB, ảnh upload lên Cloudinary.
 *   npm run seed              → chỉ THÊM bản ghi chưa có (không đụng dữ liệu đã sửa trong CMS)
 *   npm run seed -- --force   → GHI ĐÈ toàn bộ về dữ liệu mẫu (cẩn thận: mất chỉnh sửa trong CMS)
 *
 * Nguồn: seed-data/*.json (dữ liệu thật theo docs/docs_mayqueenslim.docx). Ảnh lấy từ fe/public/
 * (repo đủ cả fe/ và be/) → Cloudinary "<CLOUDINARY_FOLDER>/seed/<đường dẫn>"; public_id cố định
 * nên chạy lại không sinh ảnh trùng.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cloudinary, configureCloudinary } from "../config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { articleRepository } from "../repositories/article.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { slugify } from "../utils/slugify.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(here, "../../../fe/public");
const FORCE = process.argv.includes("--force");

const readJson = (name) => JSON.parse(readFileSync(path.join(here, "seed-data", name), "utf8"));

const uploaded = new Map(); // đường dẫn → ảnh đã upload (mỗi ảnh chỉ upload 1 lần / lần chạy)

/** "/images/products/x.jpg" → { url, publicId, width, height } trên Cloudinary */
async function upload(webPath) {
  if (!webPath) return undefined;
  if (uploaded.has(webPath)) return uploaded.get(webPath);
  const file = path.join(PUBLIC_DIR, webPath);
  if (!existsSync(file)) throw new Error(`Không thấy ảnh ${file}`);
  const publicId = `${env.cloudinary.folder}/seed/${webPath.replace(/^\/images\//, "").replace(/\.\w+$/, "")}`;
  const r = await cloudinary.uploader.upload(file, {
    public_id: publicId,
    overwrite: FORCE, // không --force: ảnh đã có thì dùng lại
    unique_filename: false,
    resource_type: "image",
  });
  const image = { url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height };
  uploaded.set(webPath, image);
  logger.info(`  ↑ ${webPath}`);
  return image;
}

async function seed(label, items, repo, prepare) {
  let added = 0;
  for (const item of items) {
    const exists = await repo.exists({ slug: item.slug });
    if (exists && !FORCE) {
      logger.info(`- bỏ qua ${label} "${item.slug}" (đã có — dùng --force để ghi đè)`);
      continue;
    }
    await repo.upsertBySlug(item.slug, await prepare(item));
    logger.info(`✔ ${label} "${item.slug}"`);
    added++;
  }
  return added;
}

try {
  if (!env.cloudinary.enabled) throw new Error("Chưa cấu hình CLOUDINARY_* trong .env");
  configureCloudinary();
  await connectDatabase();

  // Danh mục trước — sản phẩm / bài viết tham chiếu slug danh mục
  let cats = 0;
  for (const c of readJson("categories.json")) {
    if (!FORCE && (await categoryRepository.exists({ type: c.type, slug: c.slug }))) continue;
    await categoryRepository.upsertBySlug(c.type, c.slug, c);
    logger.info(`✔ danh mục ${c.type} "${c.slug}"`);
    cats++;
  }

  const products = await seed(
    "sản phẩm",
    readJson("products.json"),
    productRepository,
    async (p) => ({
      ...p,
      slugEn: slugify(p.name.en) || p.slug,
      images: await Promise.all(p.images.map(upload)),
    }),
  );

  const articles = await seed(
    "bài viết",
    readJson("articles.json"),
    articleRepository,
    async (a) => ({
      ...a,
      cover: await upload(a.cover),
      banner: await upload(a.banner),
      slugEn: slugify(a.title.en) || a.slug,
      publishedAt: new Date(`${a.publishedAt}T08:00:00+07:00`),
    }),
  );

  logger.info(
    `Xong: ${cats} danh mục, ${products} sản phẩm, ${articles} bài viết${FORCE ? " (ghi đè)" : ""}`,
  );
} catch (err) {
  logger.error({ err }, "Seed thất bại");
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
