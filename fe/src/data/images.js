/**
 * Kho ảnh tập trung — mọi component lấy đường dẫn ảnh từ đây, không viết tay "/images/...".
 * Thư mục public/images:
 *   brand/     logo B.O.T Việt Nam (bản gốc + PNG nền trong suốt: dọc, ngang, trắng, dấu B)
 *   products/  ảnh sản phẩm chất lượng cao (2000px), chia theo sản phẩm
 *   video/     khung hình trích từ video minh họa (AI) — poster video, đoạn "biến hình", ảnh mẫu cảm nhận
 *   certificates/ trang giấy chứng nhận trích từ docs/MAYQUEEN SLIM(certificate).pdf
 *   backgrounds/ ảnh nền trang trí (Unsplash License — miễn phí, không bắt buộc ghi công; ghi lại để minh bạch)
 */
export const brand = {
  original: "/images/brand/logo-bot-original.jpg",
  stacked: "/images/brand/logo-bot.png",
  stackedWhite: "/images/brand/logo-bot-white.png",
  horizontal: "/images/brand/logo-bot-horizontal.png",
  horizontalWhite: "/images/brand/logo-bot-horizontal-white.png",
  mark: "/images/brand/logo-mark.png",
};

export const backgrounds = {
  // Lá non trên nền nắng trắng (câu triết lý) — Natalie Kinnear, unsplash.com/photos/vQbo_ScHhhI
  airyLeaves: "/images/backgrounds/airy-leaves.jpg",
  // Cành bạch đàn trên nền trắng (banner trang con) — unsplash.com/photos/hX_hf2lPpUU
  eucalyptus: "/images/backgrounds/eucalyptus-white.jpg",
  // Cô gái vươn vai giữa rặng tre (Hành trình 30 ngày) — Kartabya Aryal, unsplash.com/photos/9w6Zu1w_D88
  yogaBamboo: "/images/backgrounds/yoga-bamboo.jpg",
  // Lá xanh trầm (Bảo chứng B.O.T) — Liana S, unsplash.com/photos/lNfsSlGv8vc
  moodyLeaves: "/images/backgrounds/moody-leaves.jpg",
  // Tay cầm ly sinh tố xanh (Đánh giá khách hàng) — unsplash.com/photos/9zsiNYwvYCM
  greenSmoothie: "/images/backgrounds/green-smoothie.jpg",
  // Lá non ngược sáng trên nền bokeh xanh trầm (Cộng đồng / mạng xã hội) — Uran Wang, unsplash.com/photos/MLtk0pADzBY
  bokehLeaves: "/images/backgrounds/bokeh-leaves.jpg",
  // Lá dương xỉ ngược sáng, nền tối mềm bên trái (banner chung các trang Chính sách) —
  // Doncoombez, unsplash.com/photos/EtLXcwcdYw4 (Unsplash License, dùng miễn phí).
  // Đã nối thêm nền tối nhòe bên trái (3500x1600) để cụm lá nằm nửa phải, chữ banner nằm trên nền tối.
  fernGlow: "/images/backgrounds/fern-glow-wide.jpg",
};

// Ảnh banner chung cho bài viết chưa có banner riêng (lá xanh trầm — không gắn với sản phẩm nào,
// hợp lớp phủ tối của đầu bài viết / thẻ nổi bật)
export const articleBannerFallback = backgrounds.moodyLeaves;

// Khung hình từ video minh họa bản cũ — dùng cho ảnh khách hàng ở khối Nhận xét (testimonials)
export const videoFrames = {
  portrait: "/images/video/portrait.jpg",
  morning: "/images/video/morning.jpg",
  park: "/images/video/park.jpg",
  evening: "/images/video/evening.jpg",
  productShot: "/images/hero/hero-combo-sage.jpg",
};

/**
 * Khối "Hành trình của bạn" (4 chặng) — khung hình cắt từ video đầu trang mới (mayqueen_video_update*_v2.mp4).
 * Máy tính: ảnh ngang 1920×1080, người nằm lệch PHẢI (chữ + lớp tối nằm bên trái).
 * Điện thoại: ảnh dọc 1080×1920 cắt từ bản video dọc → nét, đúng khung màn hình dọc, không phải cắt xén.
 */
export const journeyImages = {
  before: "/images/journey/before.jpg", // gương mặt buồn trong chiếc váy chật (lật ngang để người sang phải)
  beforeMobile: "/images/journey/before-mobile.jpg",
  morning: "/images/journey/morning.jpg", // buổi sáng trong bếp, hộp + lọ Mayqueen Slim
  morningMobile: "/images/journey/morning-mobile.jpg",
  evening: "/images/journey/evening.jpg", // buổi tối nhâm nhi ly Yodetox Extra
  eveningMobile: "/images/journey/evening-mobile.jpg",
  confident: "/images/journey/confident.jpg", // dạo công viên, tươi tắn
  confidentMobile: "/images/journey/confident-mobile.jpg",
};

export const certificateImages = {
  congBo: "/images/certificates/cong-bo-6926-2021.jpg",
  gmp: "/images/certificates/gmp-goldcare.jpg",
  iso: "/images/certificates/iso-22000-goldcare.jpg",
  coa: Array.from(
    { length: 9 },
    (_, i) => `/images/certificates/coa-${String(i + 1).padStart(2, "0")}.jpg`,
  ),
};

/**
 * Ảnh sản phẩm = ảnh THẬT của khách (docs/docs_mayqueenslim.docx) đã tách nền, ghép lên nền Unsplash
 * (Unsplash License — miễn phí thương mại):
 *   bục trên cỏ, tường xanh có bóng lá — Abik Peravan, unsplash.com/photos/OE53IVAWDmU
 *   bục trên cỏ, tường xanh trơn      — Abik Peravan, unsplash.com/photos/VMZhgg36g2o
 *   bục kem, bóng dương xỉ            — Yoshi cgi, unsplash.com/photos/Y-sBAmLY-u4
 *   bục vàng, bóng dương xỉ           — Yoshi cgi, unsplash.com/photos/mWYmh_Z7JOk
 *   bục đá, lá cọ                     — Pham Nhat, unsplash.com/photos/RVO9RDMi300
 * info-*: infographic gốc khách gửi (thành phần, công dụng, hướng dẫn sử dụng).
 */
export const heroImages = {
  // 2752×1536, sản phẩm ~70% ngang (chữ bên trái)
  mayqueen: "/images/hero/hero-mayqueen-sage.jpg",
  yodetox: "/images/hero/hero-yodetox-sage.jpg",
  combo: "/images/hero/hero-combo-sage.jpg",
  // 3300×1100 — banner trang con (PageHero ~3:1): sản phẩm thấp, không bị header che
  mayqueenDark: "/images/hero/page-mayqueen-sage.jpg",
  yodetoxDark: "/images/hero/page-yodetox-sage.jpg",
  // 2000×2000 — cột ảnh trang đăng nhập: sản phẩm lệch phải, chừa chỗ cho chữ bên trái
  login: "/images/hero/login-mayqueen-sage.jpg",
  // 2000×2000 — ảnh nền banner trang con trên ĐIỆN THOẠI (khung dọc: ảnh vuông sắc nét hơn banner 3:1)
  mayqueenSquare: "/images/hero/login-mayqueen-sage.jpg",
  yodetoxSquare: "/images/products/yodetox/yodetox-sage.jpg",
  // 3300×1228 — thẻ bài viết nổi bật, chữ nằm bên trái
  mayqueenWide: "/images/hero/banner-mayqueen-sage.jpg",
  yodetoxWide: "/images/hero/banner-yodetox-sage.jpg",
};

export const productImages = {
  mayqueen: {
    hero: heroImages.mayqueen,
    sage: "/images/products/mayqueen-slim/mayqueen-sage.jpg",
    fern: "/images/products/mayqueen-slim/mayqueen-fern.jpg",
    stone: "/images/products/mayqueen-slim/mayqueen-stone.jpg",
    infoIngredients: "/images/products/mayqueen-slim/info-thanh-phan.jpg",
    infoBenefits: "/images/products/mayqueen-slim/info-cong-dung.jpg",
    infoUsage: "/images/products/mayqueen-slim/info-huong-dan.jpg",
  },
  yodetox: {
    hero: heroImages.yodetox,
    sage: "/images/products/yodetox/yodetox-sage.jpg",
    fern: "/images/products/yodetox/yodetox-fern.jpg",
    infoIngredients: "/images/products/yodetox/info-thanh-phan.jpg",
    infoBenefits: "/images/products/yodetox/info-cong-dung.jpg",
    infoUsage: "/images/products/yodetox/info-huong-dan.jpg",
  },
  // 1200×1600 (3:4) — thẻ "Sản xuất đạt chuẩn" trang chủ: sản phẩm nửa trên, chừa đáy cho chữ
  cards: {
    mayqueenStone: "/images/products/cards/card-mayqueen-stone.jpg",
    yodetoxSage: "/images/products/cards/card-yodetox-sage.jpg",
    comboSage: "/images/products/cards/card-combo-sage.jpg",
  },
  combo: {
    sage: "/images/products/combo/combo-sage.jpg",
    fern: "/images/products/combo/combo-fern.jpg",
  },
};
