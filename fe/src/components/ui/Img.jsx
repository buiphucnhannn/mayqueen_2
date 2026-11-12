"use client";

import Image from "next/image";
import { cloudinaryLoader, isCloudinary } from "@/lib/image-loader";

/**
 * Thay cho next/image ở mọi nơi (cùng props):
 * - Ảnh Cloudinary → tải thẳng từ CDN Cloudinary (lib/image-loader.js).
 * - Ảnh trong /public → bộ tối ưu mặc định của Next (/_next/image).
 * Là client component vì hàm `loader` không truyền được từ server component sang next/image.
 */
export default function Img({ alt, ...props }) {
  return (
    <Image alt={alt} {...props} loader={isCloudinary(props.src) ? cloudinaryLoader : undefined} />
  );
}
