import { t } from "@/i18n";
import { heroImages, journeyImages as J, productImages as P, videoFrames as V } from "./images";

/**
 * Nội dung trang chủ v2 (theo brief "Nâng cấp website Mayqueen Slim – phiếu 38 bản 2").
 * Quy ước: thông tin CHƯA CÓ để dạng [ … ] — không tự điền; khối viết tạm gắn cờ sample: true
 * → giao diện hiện nhãn "Nội dung mẫu" để khách không đưa lên chạy thật.
 */

// Lưu ý pháp lý bắt buộc (hiện ở cuối khối video và chân trang)
export const legalNote = t(
  "Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.",
  "This food is not a medicine and cannot replace medical treatment.",
);

// ---- Khối 1 - Video TVC + 2 Slide sản phẩm ----
export const hero = {
  mute: t("Bật / tắt tiếng", "Toggle sound"),
  pause: t("Phát / tạm dừng", "Play / pause"),
  scroll: t("Cuộn xuống", "Scroll"),
  slides: [
    {
      id: "mayqueen-slim",
      eyebrow: t("Mayqueen Slim - Thực phẩm bảo vệ sức khỏe", "Mayqueen Slim - Health supplement"),
      title: t("Hỗ trợ giảm béo", "Weight support"),
      accent: t("Chuyển hóa chất béo", "Fat metabolism"),
      text: t(
        "Thực phẩm bảo vệ sức khỏe với chiết xuất quả bứa, chitosan, trà xanh, cao lá sen — hỗ trợ tăng cường chuyển hóa chất béo, hạn chế hấp thu chất béo, kiểm soát cảm giác thèm ăn.",
        "A health supplement with garcinia, chitosan, green tea and lotus leaf — supports fat metabolism, limits fat absorption and helps control cravings.",
      ),
      buy: t("Khám phá Mayqueen Slim", "Explore Mayqueen Slim"),
      buyPath: "/san-pham/mayqueen-slim",
      consult: t("Tư vấn miễn phí", "Free advice"),
      image: heroImages.mayqueen,
    },
    {
      id: "yodetox-extra",
      eyebrow: t("Yodetox Extra - Thực phẩm bổ sung", "Yodetox Extra - Supplement"),
      title: t("Diệp lục & Vitamin C", "Chlorophyll & Vitamin C"),
      accent: t("Nhẹ nhàng, tươi tắn", "Lighter, fresher"),
      text: t(
        "Bột pha uống bổ sung diệp lục tố và vitamin C — giúp cải thiện hệ tiêu hóa, giảm cảm giác đầy bụng, khó tiêu, cho cơ thể nhẹ nhàng, tươi tắn hơn.",
        "A drink powder with chlorophyll and vitamin C — helps digestion, eases bloating and indigestion, and leaves you feeling lighter and fresher.",
      ),
      buy: t("Khám phá Yodetox Extra", "Explore Yodetox Extra"),
      buyPath: "/san-pham/yodetox-extra",
      consult: t("Tư vấn miễn phí", "Free advice"),
      image: heroImages.yodetox,
    },
  ],
  // Tương thích ngược
  image: heroImages.mayqueen,
  eyebrow: t("Mayqueen Slim - Thực phẩm bảo vệ sức khỏe", "Mayqueen Slim - Health supplement"),
  title: t("Hỗ trợ giảm béo", "Weight support"),
  accent: t("Chuyển hóa chất béo", "Fat metabolism"),
  text: t(
    "Thực phẩm bảo vệ sức khỏe với chiết xuất quả bứa, chitosan, trà xanh, cao lá sen — hỗ trợ tăng cường chuyển hóa chất béo, hạn chế hấp thu chất béo, kiểm soát cảm giác thèm ăn.",
    "A health supplement with garcinia, chitosan, green tea and lotus leaf — supports fat metabolism, limits fat absorption and helps control cravings.",
  ),
  buy: t("Khám phá Mayqueen Slim", "Explore Mayqueen Slim"),
  buyPath: "/san-pham/mayqueen-slim",
  consult: t("Tư vấn miễn phí", "Free advice"),
};

// ---- Đoạn "biến hình" ngay sau video: cuộn tới đâu đổi cảnh tới đó (khung hình từ video đầu trang) ----
// image: ảnh ngang cho máy tính · imageMobile: ảnh dọc cho điện thoại (focus: căn ngang khi chỉ có ảnh ngang)
export const transformation = {
  eyebrow: t("Hành trình của bạn", "Your journey"),
  steps: [
    {
      image: J.before,
      imageMobile: J.beforeMobile,
      focusMobile: "50%", // ảnh dọc rộng hơn màn điện thoại → căn ngang giữ trọn khuôn mặt
      kicker: t("Trước đây", "Before"),
      title: t("Nặng nề,", "Heavy,"),
      accent: t("thiếu tự tin", "unsure of myself"),
      text: t(
        "Đầy bụng sau mỗi bữa ăn, quần áo chật dần — và ngại nhìn mình trong gương.",
        "Bloated after every meal, clothes getting tighter — avoiding the mirror.",
      ),
    },
    {
      image: J.morning,
      imageMobile: J.morningMobile,
      focusMobile: "80%",
      kicker: t("07:00 - Buổi sáng", "7:00 AM - Morning"),
      title: t("Bắt đầu", "Start with"),
      accent: t("từ một thói quen nhỏ", "one small habit"),
      text: t(
        "Hai viên Mayqueen Slim trước hoặc sau bữa sáng 15–30 phút — đánh thức nhịp chuyển hóa của ngày mới.",
        "Two Mayqueen Slim tablets 15–30 minutes before or after breakfast — waking up your metabolism.",
      ),
    },
    {
      image: J.evening,
      imageMobile: J.eveningMobile,
      focusMobile: "55%",
      kicker: t("20:00 - Buổi tối", "8:00 PM - Evening"),
      title: t("Thả lỏng,", "Unwind,"),
      accent: t("thanh lọc nhẹ nhàng", "cleanse gently"),
      text: t(
        "Một ly Yodetox Extra ấm sau bữa tối — để cơ thể được nghỉ ngơi và làm mới.",
        "A warm Yodetox Extra after dinner — letting your body rest and renew.",
      ),
    },
    {
      image: J.confident,
      imageMobile: J.confidentMobile,
      focusMobile: "22%",
      kicker: t("Mỗi ngày", "Every day"),
      title: t("Nhẹ nhõm,", "Lighter,"),
      accent: t("tự tin với chính mình", "confident in my body"),
      text: t(
        "Không ép cân, không bỏ bữa — chỉ là một cơ thể được chăm sóc đúng cách, từ bên trong.",
        "No crash diets, no skipped meals — just a body cared for properly, from within.",
      ),
    },
  ],
};

// ---- Khối 2 - Câu chuyện thương hiệu (theo docs/docs_mayqueenslim.docx + hồ sơ chứng nhận) ----
export const story = {
  sample: false,
  eyebrow: t("Câu chuyện Mayqueen", "The Mayqueen story"),
  title: t("Thon gọn từ bên trong", "Slim from within"),
  accent: t("Thành phần rõ ràng", "Clear ingredients"),
  // 1 đoạn ngắn kiểu Kobler (Chủ tịch sẽ viết lại bản chính thức)
  paragraphs: [
    t(
      "Mayqueen Slim hỗ trợ tăng cường chuyển hóa chất béo, hỗ trợ giảm béo với 16 thành phần như chitosan, quả bứa, trà xanh, cao lá sen. Yodetox Extra bổ sung diệp lục tố và vitamin C. Cả hai được sản xuất tại nhà máy đạt chuẩn GMP.",
      "Mayqueen Slim supports fat metabolism and weight loss with 16 ingredients including chitosan, garcinia, green tea and lotus leaf. Yodetox Extra adds chlorophyll and vitamin C. Both are made in a GMP-certified factory.",
    ),
  ],
  pillars: [
    { label: t("Thành phần", "Ingredients"), text: t("Công bố rõ định lượng", "Declared dosages") },
    { label: t("Chuẩn GMP", "GMP-certified"), text: t("Sản xuất tại Việt Nam", "Made in Vietnam") },
    {
      label: t("Mayqueen Slim", "Mayqueen Slim"),
      text: t("Uống 2 viên mỗi ngày", "2 tablets a day"),
    },
    {
      label: t("Yodetox Extra", "Yodetox Extra"),
      text: t("2 gói/lần - ngày 2–3 lần", "2 sachets, 2–3 times a day"),
    },
  ],
  // Chữ ký người đại diện: khách chưa cung cấp → để null (ẩn). Có thì điền dạng t("Tên", "Name")
  founder: null,
  founderTitle: t("Mayqueen – B.O.T Việt Nam", "Mayqueen – B.O.T Vietnam"),
  cta: t("Khám phá sản phẩm", "Explore products"),
  image: V.productShot,
};

// ---- Sản phẩm (giữ combo Sáng – Tối & nút Mua ngay từ bản cũ) ----
export const showcase = {
  eyebrow: t("Sản phẩm", "Products"),
  title: t("Mayqueen Slim & Yodetox Extra", "Mayqueen Slim & Yodetox Extra"),
  accent: t("Cho vóc dáng nhẹ nhõm", "For a lighter you"),
  text: t(
    "Dùng riêng từng sản phẩm hoặc chọn combo — tiết kiệm đến 460.000₫ so với mua lẻ.",
    "Use each on its own or pair them into a dual-action ritual.",
  ),
  all: t("Xem tất cả sản phẩm", "View all products"),
};

// ---- Khối 3 - Thành phần (tiêu đề; dữ liệu ở data/ingredients.js) ----
export const ingredientsHeading = {
  eyebrow: t("Thành phần", "Ingredients"),
  title: t("Thành phần nổi bật", "Key ingredients"),
  accent: t("Từ thảo mộc thiên nhiên", "Rooted in nature"),
  // Cột phải (tương ứng "Công nghệ phía sau sự tinh tế" của Kobler) — chỉ dùng thông tin có trong hồ sơ PDF
  process: {
    title: t("Sản xuất đạt chuẩn", "Certified production"),
    accent: t("Kiểm nghiệm rõ ràng", "Clearly tested"),
    cta: t("Xem chứng nhận", "View certificates"),
    cards: [
      {
        title: t("Nhà máy chuẩn GMP", "GMP factory"),
        text: t(
          "Sản xuất tại CTCP Dược phẩm Công nghệ cao Goldcare — GMP số 69/2023/ATTP-CNGMP.",
          "Made by Goldcare High-Tech Pharma — GMP No. 69/2023/ATTP-CNGMP.",
        ),
        image: P.cards.mayqueenStone,
      },
      {
        title: t("Nguyên liệu kiểm nghiệm", "Tested materials"),
        text: t(
          "9 phiếu kiểm nghiệm (COA) cho nguyên liệu đầu vào từ nhà cung cấp.",
          "9 certificates of analysis (COA) for incoming raw materials.",
        ),
        image: P.cards.yodetoxSage,
      },
      {
        title: t("Chuẩn ISO 22000", "ISO 22000 certified"),
        text: t(
          "Hệ thống quản lý an toàn thực phẩm đạt ISO 22000:2018.",
          "Food-safety management system certified ISO 22000:2018.",
        ),
        image: P.cards.comboSage,
      },
    ],
  },
};

// ---- Khối 4 - Chứng nhận (tiêu đề + số liệu thật; ô chứng nhận ở data/certificates.js) ----
export const certificatesHeading = {
  eyebrow: t("Chứng nhận", "Certificates"),
  title: t("Niềm tin", "Trust that"),
  accent: t("Tạo nên lựa chọn", "Shapes every choice"),
  text: t(
    "Sản xuất tại nhà máy đạt chuẩn GMP, có giấy tiếp nhận đăng ký bản công bố sản phẩm của Cục An toàn thực phẩm – Bộ Y tế.",
    "Made in a GMP-certified factory, with a product declaration receipt from the Vietnam Food Administration – Ministry of Health.",
  ),
  view: t("Xem giấy", "View"),
  reportsTitle: t("Phiếu kiểm nghiệm", "Test report"),
  // Chỉ dùng số liệu có thật (vỏ hộp + hồ sơ PDF khách gửi) — không ghi số khách hàng
  stats: [
    { value: 30, suffix: "", label: t("viên / lọ Mayqueen Slim", "tablets per bottle") },
    { value: 20, suffix: "", label: t("gói / hộp Yodetox Extra", "sachets per box") },
    {
      value: 9,
      suffix: "",
      label: t("phiếu kiểm nghiệm nguyên liệu", "raw-material test reports"),
    },
    { value: 100, suffix: "%", label: t("sản xuất tại Việt Nam", "made in Vietnam") },
  ],
};

// ---- Khối 5 - Cảm nhận khách hàng (tiêu đề; thẻ ở data/testimonials.js) ----
export const testimonialsHeading = {
  title: t("Cảm nhận khách hàng", "Customer stories"),
  text: t(
    "Những chia sẻ về hành trình chăm sóc vóc dáng cùng Mayqueen.",
    "Stories from women caring for their shape with Mayqueen.",
  ),
};

// ---- Sống đẹp (blog) ----
export const journalTeaser = {
  // dòng nhỏ = nhãn khối (như "Sản phẩm", "Thành phần"…), không lặp lại tiêu đề lớn bên dưới
  eyebrow: t("Bài viết mới", "Latest stories"),
  title: t("Sống đẹp", "Live well"),
  accent: t("Cùng Mayqueen", "With Mayqueen"),
  cta: t("Xem tất cả bài viết", "Read the journal"),
};

// ---- Dùng ở các trang khác (cửa hàng, sống đẹp) ----
export const bestsellers = {
  eyebrow: t("Cửa hàng", "Shop"),
  title: t("Sản phẩm", "Our"),
  accent: t("Mayqueen", "Products"),
  text: t(
    "Ba lựa chọn — một hành trình. Bắt đầu từ sản phẩm phù hợp với cơ thể bạn.",
    "Three choices, one journey. Start with what suits your body.",
  ),
};

export const shopPromo = {
  eyebrow: t("Chưa biết chọn gì?", "Not sure where to start?"),
  title: t("Nhận liệu trình cá nhân hóa miễn phí", "Get a free personalised ritual"),
  text: t(
    "Chuyên viên phân tích thể trạng và gợi ý gói phù hợp.",
    "A coach assesses your needs and suggests the right pack.",
  ),
  cta: t("Tư vấn 1:1 ngay", "Talk to a coach"),
};

export const socialFeed = {
  eyebrow: t("Cộng đồng", "Community"),
  title: t("Theo dõi Mayqueen trên mạng xã hội", "Join our community"),
  handle: "#SongDepCungMayqueen",
};

export const faqHeading = {
  eyebrow: t("Hỏi đáp", "FAQ"),
  title: t("Bạn hỏi, Mayqueen trả lời", "Your questions, answered"),
  text: t(
    "Chưa tìm thấy câu trả lời? Gọi ngay cho chuyên viên của chúng tôi.",
    "Can't find your answer? Call one of our coaches.",
  ),
  cta: t("Gọi", "Call"),
  consultCta: t("Đăng ký tư vấn", "Request advice"),
};
