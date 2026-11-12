"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { BACKEND_URL, backendHeaders } from "@/config/urls.mjs";

const TAGS = new Set(["products", "articles", "categories"]);

/**
 * Admin lưu sản phẩm / bài viết xong gọi hàm này → xóa cache tag tương ứng, trang web hiện dữ liệu mới ngay
 * (lib/catalog.js gắn cacheTag "products" / "articles").
 * Chỉ quản trị viên: hỏi backend /auth/me bằng cookie đăng nhập của trình duyệt.
 */
export async function refreshPublicContent(tag) {
  if (!TAGS.has(tag)) return false;
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
    headers: {
      cookie: (await cookies()).toString(),
      accept: "application/json",
      ...backendHeaders(),
    },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return false;
  updateTag(tag);
  await notifyPeers(tag);
  return true;
}

/**
 * Site anh em chạy bộ máy riêng (PEER_SITES, VD "https://mayqueen.vn") → báo để site đó cũng xoá cache.
 * Site kia đang sập / chậm → bỏ qua sau 4 giây, không ảnh hưởng thao tác lưu ở admin.
 */
async function notifyPeers(tag) {
  const peers = (process.env.PEER_SITES || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  await Promise.allSettled(
    peers.map((site) =>
      fetch(`${site}/api/revalidate`, {
        method: "POST",
        headers: { "content-type": "application/json", ...backendHeaders() },
        body: JSON.stringify({ tag }),
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }),
    ),
  );
}
