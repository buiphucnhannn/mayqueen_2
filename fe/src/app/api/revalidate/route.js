import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { PROXY_SECRET_HEADER } from "@/config/urls.mjs";

/**
 * Nhận báo "dữ liệu vừa đổi" từ site anh em (mayqueenslim.com ↔ mayqueen.vn chạy 2 bộ máy riêng):
 * admin lưu sản phẩm / bài viết ở site A → site A tự xoá cache, rồi gọi đường này của site B
 * (lib/revalidate.js) → site B cũng hiện dữ liệu mới ngay, không phải chờ cache hết hạn.
 * Chỉ nhận khi có đúng mã bí mật PROXY_SECRET (header x-proxy-secret) → người ngoài không gọi được.
 */
const TAGS = new Set(["products", "articles", "categories"]);

/** So mã bí mật trong thời gian cố định (không lộ dần từng ký tự qua thời gian phản hồi) */
function sameSecret(got, secret) {
  const a = Buffer.from(got ?? "");
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.PROXY_SECRET;
  if (!secret || !sameSecret(request.headers.get(PROXY_SECRET_HEADER), secret))
    return Response.json({ ok: false }, { status: 403 });
  const { tag } = await request.json().catch(() => ({}));
  if (!TAGS.has(tag)) return Response.json({ ok: false }, { status: 400 });
  revalidateTag(tag, { expire: 0 }); // hết hạn ngay → lần xem tiếp theo lấy dữ liệu mới
  return Response.json({ ok: true });
}
