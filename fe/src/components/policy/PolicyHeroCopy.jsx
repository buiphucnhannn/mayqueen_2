"use client";

import { usePathname } from "next/navigation";
import PageHeroCopy from "@/components/layout/PageHeroCopy";

/** "/en/policies/shipping" và "/en/chinh-sach/shipping" → cùng slug "shipping" */
export const lastSegment = (path = "") => path.replace(/\/+$/, "").split("/").pop();
export const sameSlug = (a, b) => lastSegment(a) === lastSegment(b);

/**
 * Chữ trên banner trang chính sách — đổi theo chính sách đang xem (đọc từ URL) mà KHÔNG dựng lại
 * banner / ảnh nền (banner nằm trong chinh-sach/layout.js). Mỗi lần đổi, chữ mờ dần vào.
 * items: [{ href, crumb, eyebrow, title, accent, text }] — đã dịch sẵn theo ngôn ngữ.
 * home: { label, href } — mục đầu của đường dẫn.
 */
export default function PolicyHeroCopy({ items, home }) {
  const pathname = usePathname();
  // So theo SLUG cuối đường dẫn, không so cả đường dẫn: lúc dựng sẵn ở server, pathname là đường dẫn nội bộ
  // sau rewrite (/vi/chinh-sach/van-chuyen, /en/chinh-sach/shipping), còn ở trình duyệt là đường dẫn công
  // khai (/chinh-sach/van-chuyen, /en/policies/shipping) → so cả đường dẫn thì server rơi về mục đầu,
  // trình duyệt chọn đúng mục → lệch nội dung (lỗi hydration React #418). Slug cuối giống nhau ở cả 2 nơi.
  const cur = items.find((x) => sameSlug(x.href, pathname)) ?? items[0];
  // key theo trang → riêng phần chữ được gắn lại và chạy hiệu ứng mờ dần (các khối .reveal giữ nguyên)
  const fade = (v) =>
    v && (
      <span key={cur.href} className="[animation:fadeIn_.45s_ease-out_both]">
        {v}
      </span>
    );

  return (
    <PageHeroCopy
      crumbs={[home, { label: fade(cur.crumb) }]}
      eyebrow={fade(cur.eyebrow)}
      title={fade(cur.title)}
      accent={fade(cur.accent)}
      text={fade(cur.text)}
    />
  );
}
