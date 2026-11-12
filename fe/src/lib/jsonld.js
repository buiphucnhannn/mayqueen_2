/**
 * Chuỗi JSON-LD an toàn để nhúng vào thẻ script dữ liệu có cấu trúc:
 * thay dấu "<" bằng mã unicode tương đương (JSON vẫn hợp lệ, Google đọc ra đúng ký tự) → nội dung có
 * "</script>" (vd. tiêu đề bài viết do Admin nhập) không thể đóng thẻ script sớm và chèn mã HTML.
 */
const LT = String.fromCharCode(92) + "u003c"; // gạch chéo ngược + u003c

export const jsonLdHtml = (data) => ({ __html: JSON.stringify(data).replaceAll("<", LT) });

/**
 * Đường dẫn breadcrumb cho Google (BreadcrumbList) → kết quả tìm kiếm hiện "Mayqueen Slim › Cửa hàng › …"
 * thay vì URL thô. items: [{ name, url }] — url tuyệt đối, mục cuối là trang hiện tại.
 */
export const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.url,
  })),
});
