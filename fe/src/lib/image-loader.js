/**
 * Loader cho ảnh trên Cloudinary (sản phẩm / bài viết upload trong Admin): trình duyệt tải THẲNG từ CDN
 * Cloudinary, Cloudinary tự đổi kích thước + định dạng (AVIF/WebP) + nén. Không đi vòng qua server Next
 * (/_next/image phải tự tải ảnh gốc từ Cloudinary — mạng server chập chờn một lần là ảnh hỏng, chậm hơn).
 * Dùng qua components/ui/Img.jsx; ảnh trong /public vẫn qua bộ tối ưu mặc định của Next.
 */
const CLOUDINARY = "https://res.cloudinary.com/";
const UPLOAD = "/image/upload/";

export const isCloudinary = (src) =>
  typeof src === "string" && src.startsWith(CLOUDINARY) && src.includes(UPLOAD);

export function cloudinaryLoader({ src, width, quality }) {
  // f_auto: AVIF/WebP theo trình duyệt - q: chất lượng - c_limit,w: thu nhỏ đúng bề ngang cần (không phóng to)
  return src.replace(UPLOAD, `${UPLOAD}f_auto,q_${quality || 75},c_limit,w_${width}/`);
}
