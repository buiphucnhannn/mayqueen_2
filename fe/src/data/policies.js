import { siteConfig } from "@/config/site";
import { t } from "@/i18n";

/**
 * Trang chính sách (chân trang) — NGUYÊN VĂN theo tài liệu khách cung cấp
 * ("Các Chính Sách - BOT Việt Nam", Google Docs): giữ đúng tiêu đề mục, câu chữ, thứ tự và chỗ in đậm.
 * Bản tiếng Anh dịch sát theo bản tiếng Việt.
 *
 * - title     : tên ngắn (menu, chân trang, breadcrumb)
 * - heading   : tiêu đề đầy đủ của chương trong tài liệu (đầu nội dung)
 * - urlSlug   : đường dẫn từng ngôn ngữ (/chinh-sach/doi-tra - /en/policies/returns)
 * - seoTitle  : tên tab (layout thêm " | Mayqueen Slim")
 * - hero      : banner đầu trang
 * - intro     : đoạn dẫn của chương
 * - sections  : [{ title?, text?, items?: [{ label?, text }] }]
 *               label = phần in đậm đầu dòng; **chữ** trong text = in đậm như tài liệu
 */
export const policies = [
  // ───────────── CHƯƠNG I: CHÍNH SÁCH ĐỔI TRẢ VÀ HOÀN TIỀN ─────────────
  {
    slug: "doi-tra",
    urlSlug: { vi: "doi-tra", en: "returns" },
    seoTitle: t(
      "Chính sách đổi trả – Đổi mới miễn phí 7 ngày",
      "Return & refund policy – 7-day replacement",
    ),
    title: t("Chính sách đổi trả", "Returns & refunds"),
    heading: t("Chính sách đổi trả và hoàn tiền", "Return & Refund Policy"),
    hero: {
      eyebrow: t("Đổi trả & hoàn tiền", "Returns & refunds"),
      title: t("Đổi trả", "Worry-free"),
      accent: t("an tâm", "returns"),
      text: t(
        "Sản phẩm lỗi, giao sai hoặc cận date được đổi mới miễn phí trong 07 ngày — Mayqueen chịu 100% chi phí vận chuyển 2 chiều.",
        "Faulty, incorrect or near-expiry items are replaced free within 7 days — Mayqueen covers 100% of two-way shipping.",
      ),
    },
    intro: t(
      "Chúng tôi cam kết bảo vệ quyền lợi tối đa của khách hàng đối với các sản phẩm không đạt chuẩn chất lượng hoặc có sai sót từ phía nhà sản xuất/phân phối.",
      "We are committed to fully protecting our customers' rights for any product that does not meet quality standards or has an error on the manufacturer's/distributor's side.",
    ),
    sections: [
      {
        title: t("1.1. Điều kiện áp dụng đổi trả hợp lệ", "1.1. Conditions for a valid return"),
        text: t(
          "Sản phẩm yêu cầu đổi trả phải thỏa mãn đồng thời tất cả các điều kiện khắt khe sau đây:",
          "Products requested for return must meet all of the following strict conditions at the same time:",
        ),
        items: [
          {
            label: t("Thời hạn", "Time limit"),
            text: t(
              'Yêu cầu đổi trả phải được thông báo đến bộ phận CSKH trong vòng tối đa **07 ngày (bao gồm cả thứ Bảy, Chủ nhật)** kể từ thời điểm hệ thống vận chuyển cập nhật trạng thái "Giao hàng thành công".',
              'The return request must reach Customer Care within a maximum of **7 days (including Saturdays and Sundays)** from the moment the carrier\'s system updates the status to "Delivered".',
            ),
          },
          {
            label: t("Tình trạng sản phẩm", "Product condition"),
            text: t(
              "Sản phẩm phải còn nguyên vẹn 100% như lúc ban đầu. Nguyên tem mác chống hàng giả, nguyên nilon niêm phong (seal), bao bì hộp không bị móp méo, trầy xước, rách vỡ, ẩm mốc, hoặc có bất kỳ dấu hiệu nào cho thấy đã qua sử dụng, bóc mở nắp.",
              "The product must be 100% intact as originally received: anti-counterfeit labels and sealing film (seal) intact, and the box not dented, scratched, torn, broken or damp, with no sign whatsoever of having been used or opened.",
            ),
          },
          {
            label: t("Chứng từ kèm theo", "Supporting evidence"),
            text: t(
              "Khách hàng bắt buộc phải cung cấp đầy đủ thông tin số điện thoại đặt hàng, mã đơn hàng, và đặc biệt là **Video quay lại toàn bộ quá trình mở kiện hàng (Unbox Video)**.",
              "Customers must provide the phone number used to order, the order code and, above all, **a video recording of the entire parcel opening (Unbox Video)**.",
            ),
          },
          {
            label: t("Tiêu chuẩn Video Unbox hợp lệ", "Valid Unbox Video standard"),
            text: t(
              "Video phải được quay rõ nét, không cắt ghép, không qua chỉnh sửa. Phải quay rõ 6 mặt của hộp hàng, quay rõ mã vận đơn dán trên kiện hàng trước khi dùng dao/kéo rọc bưu phẩm và quay rõ tình trạng của từng sản phẩm bên trong.",
              "The video must be clear, uncut and unedited. It must clearly show all 6 sides of the parcel, the waybill code on the parcel before it is cut open with a knife/scissors, and the condition of each product inside.",
            ),
          },
        ],
      },
      {
        title: t(
          "1.2. Các trường hợp chấp nhận đổi mới miễn phí (Hỗ trợ 100% chi phí)",
          "1.2. Cases eligible for free replacement (100% of costs covered)",
        ),
        items: [
          {
            text: t(
              "Sản phẩm bị lỗi kỹ thuật, lỗi đóng gói, rách seal, hư hỏng bao bì được xác định nguyên nhân trực tiếp từ khâu kiểm duyệt của nhà sản xuất.",
              "The product has a technical defect, packing error, torn seal or damaged packaging determined to be caused directly at the manufacturer's quality check.",
            ),
          },
          {
            text: t(
              "Sản phẩm bị biến dạng, đổ vỡ, móp méo nghiêm trọng do quá trình vận chuyển của đối tác giao hàng.",
              "The product is seriously deformed, broken or dented during transport by the delivery partner.",
            ),
          },
          {
            text: t(
              "Nhân viên kho hàng đóng gói sai mẫu mã, sai phân loại, nhầm lẫn sản phẩm hoặc thiếu hụt số lượng so với đơn đặt hàng đã xác nhận với quý khách.",
              "Warehouse staff packed the wrong model or variant, mixed up products, or sent fewer items than the order confirmed with you.",
            ),
          },
          {
            text: t(
              "Sản phẩm được giao khi đã hết hạn sử dụng hoặc cận date (còn dưới 3 tháng tính đến ngày hết hạn).",
              "The product was delivered expired or near its expiry date (less than 3 months before the expiry date).",
            ),
          },
        ],
      },
      {
        title: t(
          "1.3. Các trường hợp từ chối hỗ trợ đổi trả (Miễn trừ trách nhiệm)",
          "1.3. Cases where returns are refused (Exclusions)",
        ),
        items: [
          {
            text: t(
              "Sản phẩm đã bị khách hàng bóc tem niêm phong, lột nilon bảo vệ, hoặc đã đưa vào sử dụng dưới bất kỳ hình thức nào.",
              "The customer has broken the seal, removed the protective film, or used the product in any form.",
            ),
          },
          {
            text: t(
              "Sản phẩm bị hư hỏng, biến dạng do khách hàng bảo quản sai cách (để nơi nhiệt độ cao, tiếp xúc hóa chất, ẩm ướt, rơi vỡ sau khi đã nhận hàng).",
              "The product is damaged or deformed due to improper storage by the customer (high temperature, contact with chemicals, moisture, dropped after delivery).",
            ),
          },
          {
            text: t(
              "Yêu cầu đổi trả được phát sinh quá thời hạn 07 ngày theo quy định.",
              "The return request is made after the 7-day period.",
            ),
          },
          {
            text: t(
              "Khách hàng thay đổi ý định mua hàng, không ưng ý, không thích hoặc không còn nhu cầu sử dụng sau khi đã nhận hàng đúng chuẩn.",
              "The customer changes their mind, is not satisfied, does not like the product or no longer needs it after receiving the correct order.",
            ),
          },
          {
            text: t(
              "Khách hàng không cung cấp được Video unbox hợp lệ theo tiêu chuẩn tại mục 1.1.",
              "The customer cannot provide a valid Unbox Video as defined in section 1.1.",
            ),
          },
        ],
      },
      {
        title: t(
          "1.4. Quy trình xử lý đổi trả và hoàn tiền chi tiết",
          "1.4. Detailed return and refund process",
        ),
        items: [
          {
            label: t("Bước 1 - Tiếp nhận", "Step 1 - Request"),
            text: t(
              "Quý khách liên hệ qua Hotline hoặc Zalo CSKH, cung cấp mã đơn hàng, mô tả chi tiết tình trạng lỗi và đính kèm Video/Hình ảnh đối chứng.",
              "Contact us via the Hotline or Customer Care Zalo, provide your order code, describe the issue in detail and attach supporting video/photos.",
            ),
          },
          {
            label: t("Bước 2 - Thẩm định", "Step 2 - Review"),
            text: t(
              "Bộ phận Khiếu nại của Mayqueen sẽ tiếp nhận, đối soát với camera đóng gói tại kho và phản hồi kết quả thẩm định chậm nhất trong vòng 24 - 48 giờ làm việc.",
              "Mayqueen's Complaints team will receive the request, check it against the warehouse packing camera and reply with the result within 24 - 48 working hours at the latest.",
            ),
          },
          {
            label: t("Bước 3 - Thu hồi", "Step 3 - Pickup"),
            text: t(
              "Nếu yêu cầu hợp lệ, hệ thống sẽ tạo đơn thu hồi. Bưu tá sẽ đến tận địa chỉ của quý khách để lấy lại hàng lỗi. Quý khách vui lòng đóng gói cẩn thận như ban đầu để tránh phát sinh hư hỏng thêm.",
              "If the request is valid, a pickup order is created and a courier will come to your address to collect the faulty item. Please pack it carefully as originally received to avoid further damage.",
            ),
          },
          {
            label: t("Bước 4 - Giao hàng mới / Hoàn tiền", "Step 4 - Replacement / Refund"),
            text: t(
              "Ngay khi nhận được hàng hoàn về kho và kiểm tra đúng tình trạng như đã báo cáo, Mayqueen sẽ lập tức đóng gói và gửi lại sản phẩm mới (chi phí vận chuyển 2 chiều do Mayqueen chịu hoàn toàn 100%). Trong trường hợp sản phẩm hết hàng hoặc khách hàng yêu cầu hoàn tiền, kế toán sẽ thực hiện chuyển khoản hoàn trả đúng bằng giá trị thực thu của đơn hàng trong vòng 3-5 ngày làm việc.",
              "As soon as the returned item reaches our warehouse and its condition matches your report, Mayqueen will immediately pack and send a new product (Mayqueen covers 100% of two-way shipping). If the product is out of stock or you request a refund, our accounting team will transfer the exact amount actually paid for the order within 3-5 working days.",
            ),
          },
        ],
      },
    ],
  },

  // ───────────── CHƯƠNG II: CHÍNH SÁCH GIAO HÀNG VÀ VẬN CHUYỂN ─────────────
  {
    slug: "van-chuyen",
    urlSlug: { vi: "van-chuyen", en: "shipping" },
    seoTitle: t(
      "Chính sách vận chuyển – Freeship đơn từ 500K",
      "Shipping policy – Free shipping over 500K",
    ),
    title: t("Chính sách vận chuyển", "Shipping policy"),
    heading: t("Chính sách giao hàng và vận chuyển", "Shipping Policy"),
    hero: {
      eyebrow: t("Giao hàng toàn quốc", "Nationwide delivery"),
      title: t("Giao hàng", "Delivered"),
      accent: t("tận nơi", "to your door"),
      text: t(
        "Nội thành Hà Nội 1–2 ngày, các tỉnh thành khác 2–5 ngày làm việc. Miễn phí vận chuyển cho đơn từ 500.000₫.",
        "Hanoi in 1–2 days, other provinces in 2–5 working days. Free shipping on orders from 500,000₫.",
      ),
    },
    sections: [
      {
        title: t("2.1. Đối tác và phạm vi giao hàng", "2.1. Partners and delivery coverage"),
        text: t(
          "Mayqueen hiện đang là đối tác chiến lược của các đơn vị chuyển phát nhanh hàng đầu Việt Nam (Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, Viettel Post, J&T Express). Chúng tôi cam kết dịch vụ giao hàng tận nơi (Door-to-door) bao phủ 100% lãnh thổ Việt Nam, từ các thành phố lớn đến tận các cấp quận, huyện, xã, ấp, bản.",
          "Mayqueen is a strategic partner of Vietnam's leading express couriers (Giao Hang Nhanh, Giao Hang Tiet Kiem, Viettel Post, J&T Express). We guarantee door-to-door delivery covering 100% of Vietnam, from major cities down to districts, communes, hamlets and villages.",
        ),
      },
      {
        title: t("2.2. Thời gian giao nhận tiêu chuẩn", "2.2. Standard delivery times"),
        items: [
          {
            label: t("Nội thành Hà Nội", "Inner Hanoi"),
            text: t(
              "Thời gian xử lý đơn và giao hàng cực nhanh chỉ từ 1 - 2 ngày làm việc. Khách hàng có thể nhận trong ngày nếu đặt hàng trước 10:00 AM.",
              "Very fast processing and delivery in just 1 - 2 working days. Orders placed before 10:00 AM may be received the same day.",
            ),
          },
          {
            label: t(
              "Ngoại thành Hà Nội và các Tỉnh/Thành phố khác",
              "Outer Hanoi and other provinces/cities",
            ),
            text: t(
              "Thời gian vận chuyển dao động từ 2 - 5 ngày làm việc (không tính ngày lễ, Tết, Chủ nhật).",
              "Delivery takes 2 - 5 working days (excluding public holidays, Tet and Sundays).",
            ),
          },
          {
            label: t("Lưu ý về sự cố bất khả kháng", "Force majeure"),
            text: t(
              "Thời gian giao hàng có thể bị chậm trễ ngoài ý muốn trong các đợt Siêu Sale lớn (Lazada, Shopee, TikTok Mega Sale), do điều kiện thời tiết khắc nghiệt (mưa bão, lũ lụt), dịch bệnh, hoặc lỗi hệ thống điều phối của đối tác vận chuyển. Khi xảy ra sự cố, chúng tôi sẽ chủ động thông báo trước cho quý khách.",
              "Deliveries may be unexpectedly delayed during major sales events (Lazada, Shopee, TikTok Mega Sale), severe weather (storms, floods), epidemics, or errors in the carrier's dispatch system. Should this happen, we will notify you in advance.",
            ),
          },
        ],
      },
      {
        title: t("2.3. Quy định về cước phí vận chuyển", "2.3. Shipping fees"),
        items: [
          {
            label: t("Chính sách Freeship", "Free shipping"),
            text: t(
              "Miễn phí 100% cước phí vận chuyển toàn quốc đối với tất cả các đơn hàng có tổng giá trị thanh toán cuối cùng từ 500.000 VNĐ trở lên.",
              "100% free nationwide shipping on all orders with a final payment total of 500,000 VND or more.",
            ),
          },
          {
            label: t("Phí vận chuyển đồng giá", "Flat shipping fee"),
            text: t(
              "Với các đơn hàng dưới 500.000 VNĐ, Mayqueen trợ giá vận chuyển và chỉ thu một mức phí đồng giá duy nhất là 30.000 VNĐ/đơn hàng cho mọi tỉnh thành.",
              "For orders under 500,000 VND, Mayqueen subsidises shipping and charges a single flat fee of 30,000 VND per order for every province.",
            ),
          },
        ],
      },
      {
        title: t(
          "2.4. Trách nhiệm xử lý đơn hàng không thành công",
          "2.4. Handling unsuccessful deliveries",
        ),
        items: [
          {
            text: t(
              "Đơn vị vận chuyển sẽ nỗ lực giao hàng tối đa 03 lần. Trước khi giao, bưu tá sẽ gọi điện thoại báo trước.",
              "The carrier will attempt delivery up to 3 times. The courier will call ahead before each delivery.",
            ),
          },
          {
            text: t(
              "Nếu sau 03 lần không liên lạc được với khách hàng, hoặc khách hàng hẹn lại lịch quá lâu, đơn hàng sẽ tự động chuyển hoàn về kho. Khách hàng có nhu cầu giao lại vui lòng chịu phí vận chuyển phát sinh.",
              "If the customer cannot be reached after 3 attempts, or postpones delivery for too long, the order is automatically returned to the warehouse. Customers who want it redelivered will pay the additional shipping fee.",
            ),
          },
        ],
      },
    ],
  },

  // ───────────── CHƯƠNG III: CHÍNH SÁCH THANH TOÁN VÀ KIỂM HÀNG ─────────────
  {
    slug: "thanh-toan",
    urlSlug: { vi: "thanh-toan", en: "payment" },
    seoTitle: t(
      "Chính sách thanh toán – COD, được kiểm hàng",
      "Payment & inspection policy – Cash on delivery",
    ),
    title: t("Chính sách thanh toán", "Payment policy"),
    heading: t("Chính sách thanh toán và kiểm hàng", "Payment & Inspection Policy"),
    hero: {
      eyebrow: t("Thanh toán & kiểm hàng", "Payment & inspection"),
      title: t("Thanh toán", "Pay"),
      accent: t("khi nhận hàng", "on delivery"),
      text: t(
        "Không cần đặt cọc — đồng kiểm cùng bưu tá, hàng đúng và nguyên vẹn rồi mới thanh toán. Áp dụng toàn quốc.",
        "No deposit — inspect the parcel with the courier and pay only when it is correct and intact. Nationwide.",
      ),
    },
    sections: [
      {
        title: t("3.1. Phương thức thanh toán", "3.1. Payment method"),
        text: t(
          "Để tạo sự tiện lợi tối đa, Mayqueen áp dụng phương thức **Thanh toán tiền mặt khi nhận hàng (Ship COD - Cash on Delivery)** trên toàn quốc.",
          "For maximum convenience, Mayqueen offers **Cash on Delivery (COD)** nationwide.",
        ),
        items: [
          {
            text: t(
              "Khách hàng không cần phải đặt cọc hay chuyển khoản trước.",
              "No deposit or advance bank transfer is required.",
            ),
          },
          {
            text: t(
              "Quý khách chỉ phải thanh toán đúng số tiền in trên hóa đơn mua hàng do nhân viên giao nhận cung cấp.",
              "You only pay the exact amount printed on the invoice provided by the delivery staff.",
            ),
          },
        ],
      },
      {
        title: t(
          "3.2. Đặc quyền đồng kiểm (Được kiểm tra hàng trước khi thanh toán)",
          "3.2. Co-inspection right (Check your order before paying)",
        ),
        text: t(
          'Mayqueen áp dụng chính sách mua sắm minh bạch tuyệt đối. Quý khách hàng có đặc quyền "Đồng kiểm" cùng bưu tá giao hàng:',
          'Mayqueen applies a fully transparent shopping policy. You have the right to "co-inspect" the parcel with the courier:',
        ),
        items: [
          {
            label: t("Quyền lợi kiểm tra", "What you may check"),
            text: t(
              "Khi bưu tá mang kiện hàng đến, quý khách có quyền yêu cầu mở bưu phẩm để kiểm tra ngoại quan. Quý khách được phép kiểm tra số lượng, loại sản phẩm, màu sắc bao bì, tình trạng nguyên vẹn của tem mác, lớp nilon bảo vệ (seal).",
              "When the courier arrives, you may ask to open the parcel for an external check. You may check the quantity, product type, packaging colour, and whether the labels and protective film (seal) are intact.",
            ),
          },
          {
            label: t("Giới hạn kiểm tra", "Inspection limits"),
            text: t(
              "Quý khách KHÔNG ĐƯỢC phép bóc rách tem niêm phong, không được bóc seal hộp, không được mở nắp chai/lọ và không được dùng thử sản phẩm dưới mọi hình thức.",
              "You may NOT tear the sealing label, remove the box seal, open bottle/jar lids or try the product in any form.",
            ),
          },
          {
            label: t("Nghĩa vụ thanh toán", "Payment obligation"),
            text: t(
              "Nếu hàng hóa đúng như mô tả và nguyên vẹn, quý khách vui lòng thanh toán đủ tiền cho bưu tá. Nếu phát hiện kiện hàng có dấu hiệu bóp méo, ẩm ướt, sai mã hàng hoặc có dấu hiệu bị tráo đổi, quý khách có quyền TỪ CHỐI NHẬN HÀNG và gọi ngay cho số Hotline của chúng tôi để được giải quyết ngay lập tức. Quý khách sẽ không phải chịu bất kỳ khoản phí hoàn hàng nào trong trường hợp này.",
              "If the goods are as described and intact, please pay the courier in full. If the parcel shows signs of being crushed, damp, the wrong item or tampered with, you have the right to REFUSE DELIVERY and call our Hotline immediately for prompt resolution. You will not pay any return fee in this case.",
            ),
          },
        ],
      },
    ],
  },

  // ───────────── CHƯƠNG IV: CHÍNH SÁCH BẢO MẬT THÔNG TIN CÁ NHÂN ─────────────
  {
    slug: "bao-mat",
    urlSlug: { vi: "bao-mat", en: "privacy" },
    seoTitle: t(
      "Chính sách bảo mật thông tin cá nhân khách hàng",
      "Privacy policy – How we protect your data",
    ),
    title: t("Chính sách bảo mật", "Privacy policy"),
    heading: t("Chính sách bảo mật thông tin cá nhân", "Privacy Policy"),
    hero: {
      eyebrow: t("Quyền riêng tư", "Your privacy"),
      title: t("Bảo mật", "Your data,"),
      accent: t("thông tin", "kept private"),
      text: t(
        "Chỉ thu thập thông tin cần thiết cho giao dịch — không bán, không cho thuê, không trao đổi dữ liệu của bạn.",
        "We collect only what is needed for your purchase — and never sell, rent or trade your data.",
      ),
    },
    intro: t(
      "Sự riêng tư và an toàn dữ liệu của quý khách hàng là tài sản và trách nhiệm cao nhất của CÔNG TY TNHH ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ BOT VIỆT NAM (sau đây gọi là “Công ty BOT Việt Nam” hoặc “BOT Việt Nam”, đơn vị sở hữu thương hiệu Mayqueen Slim). Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của quý khách, phù hợp với Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và các văn bản hướng dẫn. Cập nhật lần cuối: 09/11/2026.",
      "The privacy and data security of our customers are the highest asset and responsibility of BOT VIETNAM INVESTMENT TRADING AND SERVICES COMPANY LIMITED (“BOT Vietnam”, owner of the Mayqueen Slim brand). This policy explains how we collect, use, store and protect your personal data, in line with Vietnam’s Law on Personal Data Protection No. 91/2025/QH15 and its guiding regulations. Last updated: 9 November 2026.",
    ),
    sections: [
      {
        title: t(
          "4.1. Đơn vị thu thập và xử lý dữ liệu",
          "4.1. Who collects and processes your data",
        ),
        text: t(
          `Bên kiểm soát và xử lý dữ liệu cá nhân của quý khách là ${siteConfig.company.name.vi} — mã số thuế ${siteConfig.company.taxId}, địa chỉ ${siteConfig.company.address.vi}. Liên hệ về dữ liệu cá nhân: Hotline ${siteConfig.phone} - Email ${siteConfig.company.email}.`,
          `The controller and processor of your personal data is ${siteConfig.company.name.en} — tax ID ${siteConfig.company.taxId}, address ${siteConfig.company.address.en}. Data protection contact: Hotline ${siteConfig.phone} - Email ${siteConfig.company.email}.`,
        ),
      },
      {
        title: t("4.2. Dữ liệu được thu thập và mục đích sử dụng", "4.2. Data we collect and why"),
        text: t(
          "Chúng tôi chỉ thu thập các thông tin cần thiết nhất, và chỉ dùng đúng cho mục đích đã nêu:",
          "We only collect what is strictly necessary, and use it only for the stated purposes:",
        ),
        items: [
          {
            text: t(
              "**Khi đặt hàng:** họ và tên, số điện thoại, địa chỉ giao hàng, ghi chú đơn hàng — để xác nhận và xử lý đơn, giao hàng, thu tiền khi nhận hàng (COD), hỗ trợ đổi trả và giải đáp thắc mắc về đơn.",
              "**When you order:** full name, phone number, delivery address and order notes — to confirm and process your order, deliver it, collect cash on delivery (COD), support returns and answer questions about your order.",
            ),
          },
          {
            text: t(
              "**Khi đăng ký tư vấn:** họ và tên, số điện thoại, nhu cầu và lời nhắn — để chuyên viên gọi lại tư vấn, hướng dẫn sử dụng liệu trình.",
              "**When you request advice:** full name, phone number, your goal and message — so that our consultant can call you back and guide you through your routine.",
            ),
          },
          {
            text: t(
              "**Khi tra cứu đơn hàng:** mã đơn và số điện thoại chỉ dùng để tìm đúng đơn của quý khách, không lưu thêm.",
              "**When you track an order:** the order code and phone number are used only to find your order and are not stored again.",
            ),
          },
          {
            text: t(
              "**Dữ liệu kỹ thuật:** địa chỉ IP và thông tin trình duyệt được dùng tạm thời để chống gửi đơn rác, chống gian lận và bảo vệ hệ thống. Giỏ hàng và ngôn ngữ đã chọn được lưu ngay trên trình duyệt của quý khách (localStorage / cookie), không gửi về máy chủ cho đến khi quý khách đặt hàng.",
              "**Technical data:** IP address and browser details are used temporarily to block spam orders, prevent fraud and protect our systems. Your cart and chosen language are stored in your own browser (localStorage / cookie) and are not sent to our servers until you place an order.",
            ),
          },
          {
            text: t(
              "Hiện chúng tôi không dùng dữ liệu của quý khách để gửi tin nhắn, email quảng cáo. Nếu sau này có, chúng tôi sẽ xin quý khách đồng ý riêng cho mục đích đó và quý khách có thể từ chối nhận bất cứ lúc nào. Chúng tôi không yêu cầu dữ liệu cá nhân nhạy cảm (như thông tin bệnh lý); vui lòng không ghi các thông tin này vào ô ghi chú.",
              "We currently do not use your data to send promotional messages or emails. If we ever do, we will ask for your separate consent and you can opt out at any time. We do not ask for sensitive personal data (such as medical information); please do not include it in the notes field.",
            ),
          },
        ],
      },
      {
        title: t("4.3. Sự đồng ý của khách hàng", "4.3. Your consent"),
        items: [
          {
            text: t(
              "Trước khi gửi thông tin ở form đặt hàng hoặc đăng ký tư vấn, quý khách tự tick vào ô “Tôi đã đọc và đồng ý với Chính sách bảo mật…”. Ô này không được chọn sẵn; nếu không tick, thông tin sẽ không được gửi đi.",
              "Before submitting the order or advice form, you tick the box “I have read and agree to the Privacy policy…” yourself. The box is never pre-ticked; if it is not ticked, your information is not sent.",
            ),
          },
          {
            text: t(
              "Hệ thống lưu lại thời điểm quý khách đồng ý và phiên bản chính sách đã đồng ý, để làm căn cứ khi cần.",
              "Our system records when you agreed and which version of this policy you agreed to, as evidence when needed.",
            ),
          },
          {
            text: t(
              "Quý khách có thể rút lại sự đồng ý bất cứ lúc nào bằng cách gửi yêu cầu qua Email ở mục 4.1 (hoặc gọi Hotline, chúng tôi sẽ xác nhận lại bằng tin nhắn/email). Việc rút lại không ảnh hưởng đến các xử lý hợp pháp đã thực hiện trước đó, nhưng chúng tôi có thể không tiếp tục giao được đơn hàng đang xử lý.",
              "You may withdraw your consent at any time by sending a request to the Email in section 4.1 (or by calling our Hotline, after which we will confirm by message/email). Withdrawal does not affect processing lawfully carried out before, but we may then be unable to complete an order in progress.",
            ),
          },
        ],
      },
      {
        title: t("4.4. Thời gian lưu trữ dữ liệu", "4.4. Data retention"),
        items: [
          {
            text: t(
              "Thông tin đơn hàng được lưu trong thời gian cần thiết để giao hàng, bảo hành, đổi trả và trong thời hạn lưu trữ chứng từ mà pháp luật về kế toán, thuế yêu cầu.",
              "Order information is kept for as long as needed for delivery, warranty and returns, and for the document retention period required by accounting and tax law.",
            ),
          },
          {
            text: t(
              "Thông tin đăng ký tư vấn được lưu đến khi hoàn tất tư vấn và chăm sóc sau đó, hoặc đến khi quý khách yêu cầu xóa.",
              "Advice requests are kept until the consultation and follow-up care are complete, or until you ask us to delete them.",
            ),
          },
          {
            text: t(
              "Hết thời hạn trên, dữ liệu được xóa hoặc ẩn danh hóa để không còn nhận diện được quý khách.",
              "After these periods, data is deleted or anonymised so that it can no longer identify you.",
            ),
          },
        ],
      },
      {
        title: t(
          "4.5. Cam kết Không chia sẻ dữ liệu (No-sharing Commitment)",
          "4.5. No-sharing Commitment",
        ),
        items: [
          {
            text: t(
              "BOT Việt Nam cam kết KHÔNG bán, KHÔNG cho thuê, KHÔNG trao đổi thông tin dữ liệu cá nhân của quý khách cho bất kỳ bên thứ ba nào vì mục đích trục lợi thương mại.",
              "BOT Vietnam commits to NOT sell, NOT rent and NOT exchange your personal data with any third party for commercial gain.",
            ),
          },
          {
            text: t(
              "Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết cho: đối tác giao hàng (Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, Viettel Post, J&T Express) để phát hàng đến địa chỉ của quý khách; nhà cung cấp hạ tầng kỹ thuật (máy chủ lưu trữ website, dịch vụ cơ sở dữ liệu MongoDB Atlas, dịch vụ gửi email thông báo đơn hàng nội bộ Resend và hộp thư Google) — chỉ xử lý theo chỉ dẫn của chúng tôi và có nghĩa vụ bảo mật; cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định pháp luật.",
              "Data is shared only as far as necessary with: delivery partners (Giao Hang Nhanh, Giao Hang Tiet Kiem, Viettel Post, J&T Express) to deliver your order; technical infrastructure providers (website hosting, the MongoDB Atlas database service, the Resend internal order-notification email service and Google mailboxes) — who process it only on our instructions and are bound to confidentiality; and competent state authorities when required by law.",
            ),
          },
          {
            text: t(
              "Các dịch vụ MongoDB Atlas, Resend (Hoa Kỳ) và Google có thể lưu trữ hoặc xử lý dữ liệu trên máy chủ đặt ngoài lãnh thổ Việt Nam. Chúng tôi chỉ chuyển phần dữ liệu cần thiết cho việc xử lý đơn hàng, tư vấn và thực hiện việc chuyển dữ liệu này theo quy định pháp luật về bảo vệ dữ liệu cá nhân.",
              "MongoDB Atlas, Resend (United States) and Google may store or process data on servers outside Vietnam. We transfer only the data needed to process orders and advice requests, and carry out such transfers in accordance with personal data protection law.",
            ),
          },
        ],
      },
      {
        title: t("4.6. Biện pháp bảo vệ dữ liệu", "4.6. How we protect your data"),
        text: t(
          "Website dùng kết nối mã hóa HTTPS. Dữ liệu khách hàng chỉ nhân viên được phân quyền mới truy cập được qua khu quản trị có đăng nhập; hệ thống giới hạn số lần gửi để chống dò quét và gửi rác. Khi xảy ra sự cố lộ lọt dữ liệu, chúng tôi sẽ thông báo cho cơ quan chức năng và quý khách theo quy định.",
          "The website uses encrypted HTTPS connections. Customer data can only be accessed by authorised staff through a login-protected admin area, and submissions are rate-limited to prevent scanning and spam. If a data breach occurs, we will notify the authorities and you as required by law.",
        ),
      },
      {
        title: t(
          "4.7. Quyền lợi kiểm soát thông tin của khách hàng",
          "4.7. Your control over your information",
        ),
        text: t(
          "Vào bất kỳ thời điểm nào, quý khách đều có quyền gửi yêu cầu qua Email ở mục 4.1 hoặc bằng văn bản gửi về địa chỉ công ty (có thể gọi Hotline để được hướng dẫn). Để bảo vệ quý khách, chúng tôi sẽ xác minh người gửi là chủ của thông tin (ví dụ đối chiếu số điện thoại đặt hàng) và phản hồi trong thời hạn pháp luật quy định. Quý khách có quyền yêu cầu chúng tôi:",
          "At any time, you may send a request to the Email in section 4.1 or in writing to our company address (you can call our Hotline for guidance). To protect you, we will verify that the request comes from the owner of the data (for example by checking the phone number used for the order) and reply within the time limit set by law. You have the right to ask us to:",
        ),
        items: [
          {
            text: t(
              "Cho biết dữ liệu nào của quý khách đang được xử lý và cung cấp bản sao các dữ liệu đó.",
              "Tell you which of your data is being processed and provide a copy of it.",
            ),
          },
          {
            text: t(
              "Chỉnh sửa, cập nhật lại họ tên, địa chỉ, số điện thoại.",
              "Correct or update your name, address or phone number.",
            ),
          },
          {
            text: t(
              "Xóa dữ liệu, hạn chế hoặc phản đối việc xử lý dữ liệu, rút lại sự đồng ý. Dữ liệu mà pháp luật bắt buộc phải lưu (như chứng từ bán hàng) sẽ được lưu đến hết thời hạn luật định rồi mới xóa.",
              "Delete your data, restrict or object to its processing, or withdraw your consent. Data that the law requires us to keep (such as sales records) will be kept until the statutory period ends and then deleted.",
            ),
          },
          {
            text: t(
              "Khiếu nại, tố cáo hoặc yêu cầu bồi thường thiệt hại khi quyền về dữ liệu cá nhân bị vi phạm, theo quy định pháp luật.",
              "File a complaint or claim compensation if your personal data rights are violated, as provided by law.",
            ),
          },
        ],
      },
    ],
  },

  // ───────────── CHƯƠNG V: CHÍNH SÁCH GIẢI QUYẾT KHIẾU NẠI ─────────────
  {
    slug: "khieu-nai",
    urlSlug: { vi: "khieu-nai", en: "complaints" },
    seoTitle: t(
      "Giải quyết khiếu nại – Phản hồi trong 24 giờ",
      "Dispute resolution policy – Reply within 24 hours",
    ),
    title: t("Giải quyết khiếu nại", "Dispute resolution"),
    heading: t("Chính sách giải quyết khiếu nại", "Dispute Resolution Policy"),
    hero: {
      eyebrow: t("Luôn lắng nghe", "We are listening"),
      title: t("Giải quyết", "Resolved"),
      accent: t("thấu đáo", "with care"),
      text: t(
        "Tiếp nhận khiếu nại qua Hotline, Email, Zalo, Messenger — có hướng xử lý trong tối đa 24 giờ làm việc.",
        "Complaints are accepted by Hotline, Email, Zalo and Messenger — with a resolution plan within 24 working hours.",
      ),
    },
    intro: t(
      "Mayqueen luôn lắng nghe và đặt mình vào vị trí của khách hàng. Mọi vấn đề phát sinh sẽ được giải quyết dựa trên tinh thần thiện chí và tôn trọng pháp luật.",
      "Mayqueen always listens and puts itself in the customer's shoes. Every issue will be resolved in good faith and with respect for the law.",
    ),
    sections: [
      {
        items: [
          {
            label: t("Kênh tiếp nhận", "Channels"),
            text: t(
              `Mọi khiếu nại về chất lượng sản phẩm, đơn hàng, thái độ nhân viên tư vấn hoặc bưu tá giao hàng, quý khách gửi qua một trong các kênh: Hotline ${siteConfig.phone} (08:00 – 22:00 hằng ngày); Email ${siteConfig.company.email}; Zalo ${siteConfig.phone}; Messenger trang Facebook chính thức. Vui lòng cung cấp mã đơn hàng, số điện thoại đặt hàng và hình ảnh / video sản phẩm (nếu có).`,
              `For any complaint about product quality, your order, our consultants or the delivery courier, please contact us via: Hotline ${siteConfig.phone} (8 AM – 10 PM daily); Email ${siteConfig.company.email}; Zalo ${siteConfig.phone}; or Messenger on our official Facebook page. Please include your order code, the phone number used for the order and photos / videos of the product (if any).`,
            ),
          },
          {
            label: t("Thời gian phản hồi", "Response time"),
            text: t(
              "Chúng tôi cam kết tiếp nhận và đưa ra hướng xử lý thỏa đáng cho quý khách trong vòng tối đa 24 giờ làm việc.",
              "We commit to receiving your complaint and offering a satisfactory resolution within a maximum of 24 working hours.",
            ),
          },
          {
            label: t("Quy trình xử lý", "Process"),
            text: t(
              "Bước 1 – Tiếp nhận: ghi nhận khiếu nại và xác nhận lại với quý khách. Bước 2 – Xác minh: kiểm tra đơn hàng, sản phẩm, làm việc với đơn vị vận chuyển (nếu cần). Bước 3 – Phản hồi: đưa ra hướng xử lý (đổi sản phẩm, hoàn tiền, hoặc giải thích) theo Chính sách đổi trả. Bước 4 – Hoàn tất: thực hiện phương án đã thống nhất và thông báo kết quả cho quý khách.",
              "Step 1 – Receive: we log your complaint and confirm it with you. Step 2 – Verify: we check the order and product and, if needed, work with the courier. Step 3 – Respond: we propose a solution (replacement, refund or explanation) under our Returns policy. Step 4 – Close: we carry out the agreed solution and notify you of the result.",
            ),
          },
          {
            label: t("Giải quyết tranh chấp", "Dispute resolution"),
            text: t(
              "Mayqueen ưu tiên giải quyết bằng thương lượng, hòa giải. Trường hợp không thống nhất được, quý khách có quyền yêu cầu cơ quan quản lý nhà nước về bảo vệ quyền lợi người tiêu dùng hỗ trợ, hoặc đưa vụ việc ra Trọng tài hay Tòa án có thẩm quyền theo quy định của pháp luật Việt Nam.",
              "Mayqueen prefers to resolve issues through negotiation and mediation. If we cannot reach agreement, you may ask the state consumer protection authority for assistance, or bring the matter before arbitration or a competent court under Vietnamese law.",
            ),
          },
        ],
      },
    ],
  },
];

// Nhận cả slug tiếng Việt lẫn tiếng Anh (route thật nằm ở /[lang]/chinh-sach/[slug])
export const getPolicy = (slug) =>
  policies.find((p) => p.slug === slug || p.urlSlug.vi === slug || p.urlSlug.en === slug);
