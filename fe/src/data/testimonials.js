import { t } from "@/i18n";
import { backgrounds as B, videoFrames as V } from "./images";

/**
 * Cảm nhận khách hàng — NỘI DUNG MẪU (ảnh + chữ dựng tạm bằng AI, khách cho phép để xem bố cục).
 * Mỗi thẻ hiện nhãn "Nội dung mẫu"; khi final thay bằng feedback thật (ảnh chụp tin nhắn, video khách thật).
 * Không dùng ảnh before/after cơ thể ở khối này.
 */
export const testimonials = [
  {
    name: t("Chị Minh Anh", "Ms Minh Anh"),
    meta: t("Nhân viên văn phòng - 29 tuổi", "Office worker - 29"),
    product: t("Combo Mayqueen + Yodetox", "Mayqueen + Yodetox combo"),
    image: V.portrait,
    rating: 5,
    text: t(
      "Mình thích nhịp sáng hai viên, tối một ly. Cơ thể nhẹ hơn, không bị mệt, và mình có thói quen chăm sóc bản thân đều đặn hơn.",
      "I love the rhythm — two tablets in the morning, a warm drink at night. I feel lighter, never tired, and I care for myself more consistently.",
    ),
  },
  {
    name: t("Chị Hoàng Yến", "Ms Hoàng Yến"),
    meta: t("Huấn luyện viên yoga - 32 tuổi", "Yoga teacher - 32"),
    product: "Mayqueen Slim",
    image: V.park,
    rating: 5,
    text: t(
      "Thành phần thảo mộc, giấy tờ rõ ràng nên mình yên tâm. Kết hợp tập luyện đều, mình thấy năng lượng buổi sáng tốt hơn hẳn.",
      "Botanical ingredients and clear paperwork, so I feel safe. Paired with regular practice, my mornings feel so much more energetic.",
    ),
  },
  {
    name: t("Chị Thu Hà", "Ms Thu Hà"),
    meta: t("Kinh doanh tự do - 35 tuổi", "Business owner - 35"),
    product: "Yodetox Extra",
    image: V.evening,
    rating: 5,
    text: t(
      "Ly Yodetox buổi tối thành khoảnh khắc thư giãn của mình. Vị dễ uống, sáng dậy bụng nhẹ nhõm hơn.",
      "My evening Yodetox has become my moment to unwind. It tastes lovely and I wake up feeling lighter.",
    ),
  },
  {
    name: t("Chị Ngọc Trâm", "Ms Ngọc Trâm"),
    meta: t("Sinh viên - 22 tuổi", "Student - 22"),
    product: "Mayqueen Slim",
    image: V.morning,
    rating: 5,
    text: t(
      "Hộp nhỏ gọn, mang theo đi học tiện. Chuyên viên tư vấn rất nhiệt tình, nhắc lịch uống và gửi gợi ý thực đơn.",
      "The bottle is compact and easy to carry. My coach was so kind, reminding me to take it and sending meal ideas.",
    ),
  },
  {
    name: t("Chị Lan Phương", "Ms Lan Phương"),
    meta: t("Mẹ bỉm sữa - 31 tuổi", "New mum - 31"),
    product: t("Combo Mayqueen + Yodetox", "Mayqueen + Yodetox combo"),
    image: B.greenSmoothie,
    rating: 5,
    text: t(
      "Sau sinh mình muốn lấy lại vóc dáng một cách nhẹ nhàng. Liệu trình không ép cân, không bỏ bữa nên mình duy trì được lâu.",
      "After giving birth I wanted to get my shape back gently. No crash diets, no skipped meals — so I could keep going.",
    ),
  },
  {
    name: t("Chị Bảo Ngân", "Ms Bảo Ngân"),
    meta: t("Nhân viên ngân hàng - 27 tuổi", "Banker - 27"),
    product: "Yodetox Extra",
    image: B.yogaBamboo,
    rating: 4,
    text: t(
      "Mình hay đầy bụng sau bữa tiệc, Yodetox giúp mình thấy dễ chịu hơn. Đóng gói đẹp, giao hàng nhanh.",
      "I often feel bloated after parties — Yodetox helps me feel more comfortable. Lovely packaging, fast delivery.",
    ),
  },
];
