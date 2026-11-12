import { siteConfig } from "@/config/site";

export default function robots() {
  return {
    // khu riêng tư: API, quản trị, đăng nhập, trang lỗi hệ thống. Trang thanh toán / tra cứu đơn KHÔNG chặn ở đây:
    // chúng có thẻ noindex — chặn bằng robots thì Google không đọc được noindex, URL vẫn có thể lên kết quả "không có mô tả"
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/login", "/403", "/429"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
