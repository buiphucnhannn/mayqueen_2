import { t } from "@/i18n";
import { SITE_URL } from "./urls.mjs";

/** Địa chỉ trụ sở dùng để tìm trên Google Maps (đã mã hóa URL) */
const MAPS_QUERY = encodeURIComponent("Liền kề ATT 4-9 Him Lam, Hà Đông, Hà Nội");

// Thông tin thương hiệu — lấy từ hồ sơ yêu cầu (docs/demo.docx). Sửa tại đây, toàn site cập nhật theo.
export const siteConfig = {
  name: "Mayqueen Slim",
  legalName: "MayqueenSlim Official",
  parentBrand: "B.O.T Việt Nam",
  tagline: t("Thon gọn từ bên trong", "Slim from within"),
  // Tiêu đề tab trang chủ: "Mayqueen Slim | …" (tên thương hiệu đứng đầu — tab bị cắt vẫn đọc được)
  homeTitle: t(
    "Hỗ trợ giảm béo – Chính hãng B.O.T Việt Nam",
    "Weight support – Authentic B.O.T Vietnam",
  ),
  notFoundTitle: t("Không tìm thấy trang", "Page not found"),
  description: t(
    "Thực phẩm bảo vệ sức khỏe Mayqueen Slim hỗ trợ tăng cường chuyển hóa chất béo, giảm béo. Yodetox Extra bổ sung diệp lục tố, vitamin C. Chính hãng B.O.T Việt Nam.",
    "Mayqueen Slim – a health supplement supporting fat metabolism and weight loss. Yodetox Extra – chlorophyll and vitamin C. Authentic B.O.T Vietnam.",
  ),
  keywords: [
    "Mayqueen Slim",
    "Yodetox",
    "Yodetox Extra",
    "hỗ trợ giảm béo",
    "diệp lục tố",
    "giữ dáng",
    "B.O.T Việt Nam",
  ],
  // Tự nhận theo tên miền deploy (Vercel / Render / Netlify), máy dev là localhost — xem config/urls.mjs
  url: SITE_URL,
  themeColor: "#5f7d41",
  copyrightYear: 2026,
  phone: "0969 637 542",
  phoneRaw: "0969637542",
  address: t("Hà Đông, Hà Nội, Việt Nam", "Ha Dong, Hanoi, Vietnam"),
  hours: t("08:00 – 22:00, Thứ 2 – Chủ nhật", "8 AM – 10 PM, Mon – Sun"),
  // Bản đồ = ĐỊA CHỈ TRỤ SỞ (company.address). Google chưa có dữ liệu riêng cho lô "ATT 4-9" → ghim vào
  // KĐT Him Lam Vạn Phúc (Hà Đông). Khi công ty có Google Business Profile, thay MAPS_QUERY bằng tên doanh nghiệp
  // trên Maps để ghim đúng từng căn. (Link khách gửi maps.app.goo.gl/eoVXPYNVaPmcASwV8 là tiệm "May Queen
  // Nail & Beauty" trùng tên — KHÔNG phải công ty, đã bỏ.)
  geo: { lat: 20.9844, lng: 105.7732 }, // khu Him Lam Vạn Phúc, đường Tố Hữu (OpenStreetMap)
  mapsLink: `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`,
  mapsDirections: `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`,
  // Bản đồ Google thật, nhúng công khai (không cần API key): kéo, zoom, xem đường, "Mở trong Maps"
  // hl = ngôn ngữ giao diện bản đồ (nút "Mở trong Maps", điều khoản…) theo ngôn ngữ trang
  mapsEmbed: t(
    `https://maps.google.com/maps?q=${MAPS_QUERY}&z=16&hl=vi&output=embed`,
    `https://maps.google.com/maps?q=${MAPS_QUERY}&z=16&hl=en&output=embed`,
  ),
  facebook: "https://www.facebook.com/profile.php?id=61586783311362",
  messenger: "https://m.me/61586783311362",
  zalo: "https://zalo.me/0969637542",
  // Link kênh TikTok của shop (VD "https://www.tiktok.com/@mayqueenslim"). ĐỂ TRỐNG = ẩn icon TikTok
  // ở chân trang + khối Cộng đồng (không trỏ về trang chủ TikTok chung). Có kênh thì điền vào là hiện.
  tiktok: "",
  // ---- Video đầu trang: THAY FILE TẠI ĐÂY (đặt video mới vào public/videos/ rồi sửa các dòng dưới) ----
  // Đổi video → đặt TÊN FILE MỚI (video / ảnh được trình duyệt giữ 30 ngày, trùng tên thì khách vẫn thấy bản cũ).
  // Poster = khung hình đầu của video (hiện ngay khi mở trang, video phủ lên khi đã chạy).
  heroVideo: "/videos/mayqueen_video_update_v2.mp4", // máy tính: 16:9, 1920×1080
  heroPoster: "/images/video/hero-poster-v3.jpg",
  heroVideoMobile: "/videos/mayqueen_video_update_mobile_v2.mp4", // điện thoại: dọc 9:16
  heroPosterMobile: "/images/video/hero-poster-mobile-v3.jpg",
  // Giây bắt đầu phát: bỏ đoạn mở màn từ màn đen của video (0 → 0,45s) → không bị "chớp đen" sau ảnh poster
  heroVideoStart: 0.45,
  // ---- Khối "Cảm nhận khách hàng" (data/testimonials.js) — true: hiện ở trang chủ + trang sản phẩm ----
  // Lưu ý: nội dung hiện tại là mẫu dựng bằng AI; nên thay bằng phản hồi THẬT của khách (được khách đồng ý đăng).
  showTestimonials: true,
  // ---- Thông tin pháp lý (khách cung cấp) ----
  company: {
    // Tên pháp lý (giấy chứng nhận ĐKDN) — bản tiếng Việt là tên đăng ký chính thức.
    // Bản tiếng Anh: dịch theo cách đặt tên chuẩn của doanh nghiệp VN. TODO: đối chiếu "Tên công ty viết bằng
    // tiếng nước ngoài" trên giấy ĐKDN (MST 0110193530) — nếu có tên quốc tế đăng ký thì thay vào đây.
    name: t(
      "CÔNG TY TNHH ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ BOT VIỆT NAM",
      "BOT VIETNAM INVESTMENT TRADING AND SERVICES COMPANY LIMITED",
    ),
    taxId: "0110193530",
    address: t(
      "Liền kề ATT 4-9 Him Lam, Hà Đông, Thành phố Hà Nội",
      "Townhouse ATT 4-9 Him Lam, Ha Dong, Hanoi",
    ),
    streetAddress: "Liền kề ATT 4-9 Him Lam",
    email: "marketingbotvn@gmail.com",
  },
  freeShipThreshold: 500000,
  shippingFee: 30000,
};
