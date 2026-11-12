"use client";

import { api } from "@/lib/api";

/**
 * Ảnh CHỜ LƯU — 2 nguồn, mọi chỗ chọn ảnh đều hỗ trợ:
 * - Từ máy (chọn / dán / kéo-thả): stageFile(file) → hiện ngay bằng blob URL (chưa upload) và NÉN NGẦM
 *   (cạnh dài ≤ 2400px, JPEG ~0.86; ảnh nền trong suốt giữ WebP) → ảnh 5–8MB còn vài trăm KB.
 * - Từ link: stageUrl(url) → kiểm tra link đúng là ảnh rồi hiện ngay từ link gốc.
 * Bấm Lưu: createUploader(folder) đưa MỌI ảnh chưa nằm trên Cloudinary lên Cloudinary (3 ảnh song song,
 * báo tiến độ): file → upload; link → backend nhờ Cloudinary chép về. Rồi thay URL trong dữ liệu gửi đi
 * (ảnh lẻ, danh sách ảnh, HTML bài viết). Bỏ ngang không lưu → không có ảnh rác trên Cloudinary.
 * Ảnh luôn được chép về Cloudinary (kể cả ảnh từ link) → không mất khi trang gốc xóa / chặn, được tối ưu,
 * và qua được bộ lọc HTML của backend (chỉ nhận ảnh Cloudinary).
 */
export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const ACCEPTED = new Set(ACCEPT.split(","));
const MAX_INPUT_MB = 25; // ảnh gốc từ máy (sau khi nén còn nhỏ hơn giới hạn 8MB của backend)
const MAX_SIDE = 2400;
const CONCURRENCY = 3;
const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\//;

const staged = new Map(); // blobUrl → Promise<File> (bản đã nén)

export const isLocal = (url) => typeof url === "string" && url.startsWith("blob:");
const isRemote = (url) => /^https?:\/\//i.test(url ?? "") && !CLOUDINARY.test(url);
/** Ảnh cần đưa lên Cloudinary khi lưu: ảnh từ máy (blob) hoặc link ngoài */
export const needsUpload = (url) => isLocal(url) || isRemote(url);

/** Ảnh có điểm ảnh trong suốt? (lấy mẫu trên bản thu nhỏ 32×32 — nhanh) */
function hasAlpha(bitmap) {
  const c = Object.assign(document.createElement("canvas"), { width: 32, height: 32 });
  const g = c.getContext("2d");
  g.drawImage(bitmap, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

/** Nén ảnh bằng canvas; lỗi / không lợi hơn thì giữ file gốc */
async function compress(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400 * 1024) return file; // ảnh nhỏ sẵn → giữ nguyên
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    // Ảnh thường → JPEG (ảnh WebP vừa tải lên làm bộ tối ưu next/image lỗi 500 ở lần hiển thị đầu);
    // chỉ ảnh có nền trong suốt mới giữ WebP. Khách vẫn nhận WebP/AVIF nhờ Cloudinary f_auto.
    const alpha = hasAlpha(bitmap);
    bitmap.close?.();
    const type = alpha ? "image/webp" : "image/jpeg";
    const blob = await new Promise((r) => canvas.toBlob(r, type, 0.86));
    if (!blob || blob.size >= file.size) return file;
    const ext = alpha ? ".webp" : ".jpg";
    return new File([blob], file.name.replace(/\.\w+$/, "") + ext, { type });
  } catch {
    return file;
  }
}

/** Kiểm tra file; lỗi → throw Error (câu tiếng Việt để hiện toast) */
export function checkFile(file) {
  if (!ACCEPTED.has(file.type)) throw new Error(`"${file.name}" không phải ảnh JPG, PNG, WebP`);
  if (file.size > MAX_INPUT_MB * 1024 * 1024)
    throw new Error(`Ảnh "${file.name}" lớn hơn ${MAX_INPUT_MB}MB`);
}

/** Ảnh từ máy → { url: blob } hiện ngay; bắt đầu nén ngầm */
export function stageFile(file) {
  checkFile(file);
  const url = URL.createObjectURL(file);
  staged.set(url, compress(file));
  return { url, alt: "" };
}

/**
 * Link ảnh → { url } sau khi kiểm tra link mở được và đúng là ảnh (tải thử trong trình duyệt, tối đa 15s).
 * Lỗi → throw Error (câu tiếng Việt). Link Cloudinary của website dùng thẳng, không cần chép lại.
 */
export async function stageUrl(raw) {
  const url = String(raw ?? "").trim();
  if (!/^https?:\/\/\S+$/i.test(url))
    throw new Error("Link ảnh phải bắt đầu bằng http:// hoặc https://");
  const probe = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => reject(new Error("Link ảnh phản hồi quá lâu")), 15_000);
      img.onload = () => {
        clearTimeout(timer);
        img.naturalWidth > 0 ? resolve() : reject(new Error("Link không phải ảnh"));
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            "Không mở được ảnh từ link này — kiểm tra lại link (phải là link trực tiếp tới ảnh)",
          ),
        );
      };
      img.referrerPolicy = "no-referrer";
      img.src = url;
    });
  // mạng chập chờn → thử lại 1 lần sau 1 giây rồi mới báo lỗi
  await probe().catch(() => new Promise((r) => setTimeout(r, 1000)).then(probe));
  return { url, alt: "" };
}

/** Upload 1 file lên Cloudinary qua backend → { url, publicId, width, height } */
async function uploadOne(file, folder) {
  const body = new FormData();
  body.append("files", file);
  const res = await api(`/uploads/images?folder=${folder}`, { method: "POST", body });
  return res.data[0];
}

/** Nhờ backend (Cloudinary) chép ảnh từ link ngoài về */
async function importUrl(url, folder) {
  const res = await api("/uploads/images/from-url", { method: "POST", body: { url, folder } });
  return res.data;
}

/** Upload ngay (không qua hàng chờ) — dùng nội bộ khi cần */
export async function uploadFiles(files, folder) {
  return Promise.all(files.map(async (f) => uploadOne(await compress(f), folder)));
}

// HTML từ trình soạn thảo: src có thể chứa &amp; (dấu & đã mã hóa) → giải mã khi tải, giữ nguyên khi thay
const decode = (s) => s.replace(/&amp;/g, "&");
const SRC_RE = /src="([^"]+)"/g;
const htmlSrcs = (html = "") =>
  [...html.matchAll(SRC_RE)].map((m) => decode(m[1])).filter(needsUpload);

/**
 * Bộ tải ảnh cho 1 lần bấm Lưu:
 *   const up = createUploader("articles", (done, total) => ...);
 *   await up.prepare(up.collect(cover, list, html));  // tải song song, báo tiến độ
 *   up.image(img) / up.images(list) / up.html(html)    // thay bằng ảnh Cloudinary
 */
export function createUploader(folder, onProgress) {
  const results = new Map(); // url gốc (blob / link) → ảnh Cloudinary

  async function prepare(urls) {
    const todo = [...new Set(urls.filter(needsUpload))].filter((u) => !results.has(u));
    let done = 0;
    onProgress?.(0, todo.length);
    const queue = [...todo];
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        if (isLocal(url)) {
          const pending = staged.get(url);
          if (!pending) throw new Error("Ảnh chờ tải lên không còn — vui lòng chọn lại ảnh");
          results.set(url, await uploadOne(await pending, folder));
        } else {
          try {
            results.set(url, await importUrl(url, folder));
          } catch (err) {
            throw new Error(`${err.message} (${url.length > 70 ? url.slice(0, 70) + "…" : url})`);
          }
        }
        onProgress?.(++done, todo.length);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
  }

  const swap = (img) => {
    if (!img || !needsUpload(img.url)) return img;
    const up = results.get(img.url);
    return up ? { ...up, alt: img.alt ?? "" } : img;
  };

  return {
    prepare,
    /** Các URL cần đưa lên Cloudinary trong: ảnh lẻ, danh sách ảnh, HTML */
    collect: (...parts) =>
      parts.flatMap((p) =>
        typeof p === "string" ? htmlSrcs(p) : Array.isArray(p) ? p.map((i) => i?.url) : [p?.url],
      ),
    image: swap,
    images: (list) => list.map(swap),
    html: (html = "") =>
      html.replace(SRC_RE, (m, raw) => {
        const up = results.get(decode(raw));
        return up ? `src="${up.url}"` : m;
      }),
  };
}
