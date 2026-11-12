import { siteConfig } from "@/config/site";
import { t } from "@/i18n";

// Menu chính bên trái logo (đường dẫn tiếng Việt — đi qua href(lang, path) khi render).
// Bên phải logo là nút "Liên hệ" mở popup tư vấn (ui.contact).
export const nav = [
  { label: t("Cửa hàng", "Shop"), path: "/san-pham" },
  { label: t("Combo liệu trình", "Ritual sets"), path: "/san-pham/combo-sang-dot-toi-loc" },
  { label: t("Sống đẹp", "Journal"), path: "/song-dep" },
];

// Nhãn giao diện dùng chung
export const ui = {
  consult: t("Tư vấn miễn phí", "Free advice"),
  contact: t("Liên hệ", "Contact"),
  shopNow: t("Mua ngay", "Buy now"),
  addToCart: t("Thêm vào giỏ", "Add to bag"),
  added: t("Đã thêm ✓", "Added ✓"),
  viewProduct: t("Xem chi tiết", "View details"),
  from: t("Chỉ từ", "From"),
  reviews: t("đánh giá", "reviews"),
  readMore: t("Đọc tiếp", "Read more"),
  menu: t("Menu", "Menu"),
  close: t("Đóng", "Close"),
  toTop: t("Lên đầu trang", "Back to top"),
  call: t("Gọi hotline", "Call us"),
  quickContact: t("Liên hệ nhanh", "Quick contact"), // nút nổi góc phải dưới (mở Hotline / Zalo / Messenger)
  productList: t("Danh sách sản phẩm", "Product list"), // tiêu đề ẩn (chỉ trình đọc màn hình) trên lưới sản phẩm
  chatZalo: t("Chat Zalo", "Chat on Zalo"),
  chatMessenger: t("Chat Messenger", "Messenger"),
  home: t("Trang chủ", "Home"),
  directions: t("Chỉ đường", "Directions"),
  language: t("Ngôn ngữ", "Language"),
  view: t("Xem giấy", "View"),
  search: {
    open: t("Tìm kiếm", "Search"),
    label: t("Tìm kiếm sản phẩm, bài viết", "Search products and articles"),
    close: t("Đóng tìm kiếm", "Close search"),
    placeholder: t("Tìm sản phẩm, bài viết…", "Search products, articles…"),
    suggest: t("Gợi ý sản phẩm", "Suggested products"),
    results: t("Kết quả", "Results"),
    empty: t("Không tìm thấy kết quả phù hợp.", "No matching results."),
    product: t("Sản phẩm", "Product"),
    article: t("Sống đẹp", "Journal"),
  },
  consultModal: {
    title: t("Nhận tư vấn miễn phí", "Get free advice"),
    desc: t(
      "Để lại thông tin — chuyên viên Mayqueen liên hệ trong vòng 24 giờ để phân tích thể trạng và gợi ý liệu trình phù hợp.",
      "Leave your details — a Mayqueen coach will contact you within 24 hours to assess your needs and suggest the right ritual.",
    ),
    headline: t("Liệu trình\ndành riêng cho bạn", "A ritual\nmade for you"),
    bullets: [
      t("Phân tích thể trạng & thói quen ăn uống", "Body & eating-habit assessment"),
      t("Lộ trình cá nhân hóa, theo dõi 1:1", "Personalised plan with 1:1 follow-up"),
      t("Hoàn toàn miễn phí, không ràng buộc", "Completely free, no commitment"),
    ],
    or: t("Hoặc liên hệ nhanh", "Or reach us on"),
    close: t("Đóng", "Close"),
  },
  product: {
    chooseOption: t("Chọn gói liệu trình", "Choose your pack"),
    popular: t("Phổ biến", "Popular"),
    buyNow: t("Mua ngay", "Buy now"),
    perks: [
      t("Freeship đơn từ 500K", "Free shipping over 500K"),
      t("Kiểm tra hàng, COD", "Inspect & pay on delivery"),
      t("Chính hãng B.O.T", "Authentic B.O.T"),
    ],
    description: t("Mô tả sản phẩm", "Description"),
    benefits: t("Công dụng", "Benefits"),
    ingredients: t("Thành phần nổi bật", "Key ingredients"),
    usage: t("Cách dùng", "How to use"),
    spec: t("Quy cách", "Pack size"),
    related: t("Hoàn thiện liệu trình của bạn", "Complete your ritual"),
    reviewsTitle: t("Khách hàng nói gì", "What customers say"),
    disclaimer: t(
      "Thực phẩm bảo vệ sức khỏe. Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.",
      "Health supplement. This food is not a medicine and cannot replace medical treatment.",
    ),
  },
  cart: {
    title: t("Giỏ hàng", "Your bag"),
    empty: t("Giỏ hàng đang trống", "Your bag is empty"),
    emptyText: t(
      "Khám phá liệu trình giữ dáng từ thảo mộc nhé!",
      "Discover our botanical body-care rituals!",
    ),
    continue: t("Tiếp tục mua sắm", "Continue shopping"),
    subtotal: t("Tạm tính", "Subtotal"),
    saved: t("Bạn tiết kiệm", "You saved"),
    savedNote: t("Đã trừ sẵn vào giá sản phẩm", "Already included in the prices"),
    checkout: t("Đặt hàng ngay", "Checkout"),
    freeShipLeft: t("Mua thêm {amount} để được FREESHIP", "Spend {amount} more for FREE shipping"),
    freeShipDone: t("Tuyệt! Đơn hàng được miễn phí vận chuyển", "Great! Your order ships free"),
    remove: t("Xóa", "Remove"),
    note: t(
      "COD toàn quốc - Chuyển khoản trước được miễn phí vận chuyển",
      "Nationwide COD - Free shipping when you pay by bank transfer",
    ),
    upsell: t("Hoàn thiện liệu trình", "Complete your ritual"),
  },
  checkout: {
    title: t("Đặt hàng", "Checkout"),
    // tên tab: ngắn, rõ việc khách đang làm (trang này noindex — không cần từ khóa SEO); layout thêm " | Mayqueen Slim"
    seoTitle: t("Đặt hàng", "Checkout"),
    // banner đầu trang (cùng bố cục các trang con: dòng nhỏ + tiêu đề 2 màu + mô tả)
    eyebrow: t("COD hoặc chuyển khoản", "Cash on delivery or bank transfer"),
    heroTitle: t("Hoàn tất", "Complete"),
    heroAccent: t("đơn hàng", "your order"),
    text: t(
      "Điền thông tin giao hàng — chuyên viên sẽ gọi xác nhận đơn sớm nhất trong giờ làm việc.",
      "Fill in your delivery details — our team will call to confirm your order as soon as possible during business hours.",
    ),
    shippingInfo: t("Thông tin giao hàng", "Delivery details"),
    name: t("Họ và tên", "Full name"),
    phone: t("Số điện thoại", "Phone number"),
    address: t("Địa chỉ nhận hàng", "Delivery address"),
    province: t("Tỉnh / Thành phố", "Province / City"),
    note: t("Ghi chú cho đơn hàng", "Order notes"),
    payment: t("Hình thức thanh toán", "Payment method"),
    cod: t("Thanh toán khi nhận hàng (COD)", "Cash on delivery (COD)"),
    codNote: t("Kiểm tra hàng rồi mới thanh toán", "Inspect your order, then pay"),
    bank: t("Chuyển khoản ngân hàng (quét mã QR)", "Bank transfer (scan QR)"),
    bankNote: t(
      "Có mã QR ngay, quét bằng app ngân hàng là xong",
      "Get a QR code right away — scan it in your banking app",
    ),
    freeShipBadge: t("Freeship", "Free shipping"),
    transferTip: t(
      "Ưu tiên chuyển khoản trước được miễn phí vận chuyển",
      "Pay by bank transfer first and shipping is free",
    ),
    transferFreeShip: t(
      "Chuyển khoản trước nên đơn được miễn phí vận chuyển.",
      "You're paying by bank transfer, so shipping is free.",
    ),
    summary: t("Đơn hàng của bạn", "Your order"),
    subtotal: t("Tạm tính", "Subtotal"),
    saved: t("Bạn đã tiết kiệm", "You saved"),
    savedNote: t("Đã trừ sẵn vào giá từng sản phẩm.", "Already reflected in the item prices."),
    shipping: t("Phí vận chuyển", "Shipping"),
    free: t("Miễn phí", "Free"),
    total: t("Tổng cộng", "Total"),
    placeOrder: t("Xác nhận đặt hàng", "Place order"),
    sending: t("Đang gửi đơn...", "Placing order..."),
    secure: t("Thông tin của bạn được bảo mật tuyệt đối", "Your details are kept private"),
    required: t("Vui lòng điền thông tin này", "This field is required"),
    nameShort: t("Họ tên quá ngắn", "Name is too short"),
    nameInvalid: t(
      "Họ tên chỉ gồm chữ cái và khoảng trắng",
      "Name can only contain letters and spaces",
    ),
    phoneError: t(
      "Số điện thoại không hợp lệ (VD: 0912 345 678)",
      "Invalid phone number (e.g. 0912 345 678)",
    ),
    rateLimited: t(
      "Bạn đặt hàng quá nhiều lần. Vui lòng thử lại sau ít phút hoặc gọi hotline.",
      "Too many orders. Please try again in a few minutes or call our hotline.",
    ),
    error: t(
      "Đặt hàng thất bại, vui lòng thử lại hoặc gọi hotline.",
      "Order failed — please try again or call us.",
    ),
    empty: t("Giỏ hàng đang trống", "Your bag is empty"),
    continue: t("Khám phá sản phẩm", "Explore products"),
    thanks: t("Đặt hàng thành công!", "Order placed!"),
    thanksText: t(
      "Cảm ơn bạn đã tin chọn Mayqueen. Chuyên viên sẽ sớm gọi xác nhận đơn hàng của bạn.",
      "Thank you for choosing Mayqueen. Our team will call you shortly to confirm your order.",
    ),
    thanksTextBank: t(
      "Cảm ơn bạn đã chọn Mayqueen! Vui lòng chuyển khoản theo thông tin bên dưới, chúng tôi sẽ gọi xác nhận khi nhận được tiền.",
      "Thank you for choosing Mayqueen! Please transfer using the details below; we'll call to confirm once payment arrives.",
    ),
    orderId: t("Mã đơn", "Order ID"),
    backHome: t("Về trang chủ", "Back to home"),
  },
  // Trang tra cứu đơn hàng (/tra-cuu-don-hang) — khách nhập mã đơn + SĐT đặt hàng
  track: {
    title: t("Tra cứu đơn hàng", "Track order"),
    seoTitle: t("Tra cứu đơn hàng", "Track your order"),
    eyebrow: t("Theo dõi đơn hàng", "Order status"),
    heroTitle: t("Tra cứu", "Track"),
    heroAccent: t("đơn hàng", "your order"),
    text: t(
      "Nhập mã đơn và số điện thoại đã dùng khi đặt hàng để xem tình trạng đơn của bạn.",
      "Enter your order ID and the phone number used at checkout to see your order status.",
    ),
    formTitle: t("Thông tin tra cứu", "Find your order"),
    code: t("Mã đơn hàng", "Order ID"),
    codeHint: t(
      "Mã đơn hiện ở màn hình đặt hàng thành công, hoặc hỏi hotline (VD: MQ7K2P9X)",
      "Shown on the order confirmation screen, or ask our hotline (e.g. MQ7K2P9X)",
    ),
    codeError: t("Mã đơn không hợp lệ (VD: MQ7K2P9X)", "Invalid order ID (e.g. MQ7K2P9X)"),
    phone: t("Số điện thoại đặt hàng", "Phone number used at checkout"),
    phoneError: t(
      "Số điện thoại không hợp lệ (VD: 0912 345 678)",
      "Invalid phone number (e.g. 0912 345 678)",
    ),
    submit: t("Tra cứu", "Track order"),
    sending: t("Đang tra cứu...", "Searching..."),
    notFound: t(
      "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại đã dùng khi đặt hàng.",
      "No order found. Please check your order ID and the phone number used at checkout.",
    ),
    rateLimited: t(
      "Bạn tra cứu sai quá nhiều lần. Vui lòng thử lại sau {minutes} phút hoặc gọi hotline.",
      "Too many unsuccessful attempts. Please try again in {minutes} minutes or call our hotline.",
    ),
    error: t(
      "Không tra cứu được lúc này, vui lòng thử lại hoặc gọi hotline.",
      "Something went wrong — please try again or call us.",
    ),
    orderId: t("Mã đơn", "Order ID"),
    placedAt: t("Ngày đặt", "Placed on"),
    statusTitle: t("Trạng thái đơn hàng", "Order status"),
    steps: {
      pending: t("Chờ xác nhận", "Awaiting confirmation"),
      confirmed: t("Đã xác nhận", "Confirmed"),
      shipping: t("Đang giao", "Shipping"),
      completed: t("Hoàn tất", "Completed"),
    },
    cancelled: t("Đã hủy", "Cancelled"),
    cancelledText: t(
      "Đơn hàng này đã bị hủy. Nếu bạn cần đặt lại hoặc có thắc mắc, vui lòng gọi hotline.",
      "This order has been cancelled. Call our hotline if you'd like to re-order or have any questions.",
    ),
    items: t("Sản phẩm", "Items"),
    qty: t("SL", "Qty"),
    subtotal: t("Tạm tính", "Subtotal"),
    shipping: t("Phí vận chuyển", "Shipping"),
    free: t("Miễn phí", "Free"),
    total: t("Tổng cộng", "Total"),
    payment: t("Thanh toán", "Payment"),
    methods: {
      cod: t("Thanh toán khi nhận hàng (COD)", "Cash on delivery (COD)"),
      bank_transfer: t("Chuyển khoản ngân hàng", "Bank transfer"),
    },
    paid: t("Đã thanh toán", "Paid"),
    awaitingPayment: t("Chờ thanh toán", "Awaiting payment"),
    // khách đã bấm "Xác nhận đã thanh toán", shop đang đối chiếu tiền về
    verifyingPayment: t("Đang kiểm tra thanh toán", "Verifying payment"),
    reviewQr: t("Chưa chuyển khoản được? Xem lại mã QR", "Haven't paid yet? Show the QR code"),
    help: t("Cần hỗ trợ về đơn hàng?", "Need help with your order?"),
    helpText: t(
      `Gọi hotline / Zalo — chuyên viên Mayqueen hỗ trợ ${siteConfig.hours.vi}.`,
      `Call or Zalo us — the Mayqueen team is available ${siteConfig.hours.en}.`,
    ),
  },
  form: {
    name: t("Họ và tên", "Full name"),
    phone: t("Số điện thoại", "Phone number"),
    goal: t("Vấn đề bạn quan tâm", "What concerns you"),
    goals: [
      t("Giảm mỡ thừa, vòng bụng", "Lose fat & belly"),
      t("Thanh lọc, giảm đầy bụng", "Detox & de-bloat"),
      t("Giữ dáng sau sinh", "Post-pregnancy shape"),
      t("Duy trì vóc dáng", "Maintain my shape"),
      t("Đẹp da, khỏe từ bên trong", "Glowing skin & wellness"),
      t("Cần chuyên viên tư vấn", "Not sure — advise me"),
    ],
    note: t(
      "Chiều cao, cân nặng, mục tiêu…",
      "Height, weight, your goal… (no medical details needed)",
    ),
    submit: t("Nhận tư vấn miễn phí", "Get free advice"),
    sending: t("Đang gửi...", "Sending..."),
    success: t(
      //   giữ các từ ghép ("liên hệ", "24 giờ") không bị tách xuống dòng
      "Cảm ơn bạn! Chuyên viên sẽ liên hệ trong vòng 24 giờ.",
      "Thank you! A coach will contact you within 24 hours.",
    ),
    again: t("Gửi yêu cầu khác", "Send another request"),
    error: t(
      "Gửi thất bại, vui lòng thử lại hoặc gọi hotline.",
      "Something went wrong — please try again or call us.",
    ),
    nameError: t("Vui lòng nhập họ tên", "Please enter your name"),
    nameShort: t("Họ tên quá ngắn", "Name is too short"),
    // câu lỗi NGẮN (1 dòng): hiện đè lên viền ô nhập, không làm popup tư vấn dài ra
    nameInvalid: t("Chỉ nhập chữ cái", "Letters only"),
    phoneError: t("SĐT chưa đúng", "Invalid phone"),
    rateLimited: t(
      "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau ít phút hoặc gọi hotline để được hỗ trợ ngay.",
      "Too many requests. Please try again in a few minutes or call our hotline.",
    ),
  },
};

export const footer = {
  about: t(
    "Mayqueen Slim — thương hiệu chăm sóc sức khỏe thuộc B.O.T Việt Nam. Giải pháp giữ dáng và thanh lọc từ thảo mộc thiên nhiên cho người Việt hiện đại.",
    "Mayqueen Slim — a wellness brand by B.O.T Vietnam. Botanical body-care and detox rituals for modern Vietnamese living.",
  ),
  shop: t("Cửa hàng", "Shop"),
  journal: t("Sống đẹp", "Journal"),
  policies: t("Chính sách", "Policies"),
  trackOrder: t("Tra cứu đơn hàng", "Track order"),
  contact: t("Liên hệ", "Contact"),
  hotline: t("Hotline / Zalo", "Hotline / Zalo"),
  company: t("Thông tin doanh nghiệp", "Company information"),
  needHelp: t("Cần hỗ trợ?", "Need help?"),
  needHelpText: t(
    "Chuyên viên Mayqueen sẵn sàng giải đáp về đơn hàng, đổi trả và liệu trình.",
    "Our team is happy to help with orders, returns and your ritual.",
  ),
  follow: t("Theo dõi", "Follow us"),
  hours: t("Giờ làm việc", "Opening hours"),
  // Lặp lại dòng lưu ý bắt buộc ở chân trang (theo brief)
  disclaimer: t(
    "Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.",
    "This food is not a medicine and cannot replace medical treatment.",
  ),
  taxId: t("MST", "Tax ID"),
  mapHint: t("Bấm để dùng bản đồ", "Click to use the map"),
  rights: t("Bảo lưu mọi quyền.", "All rights reserved."),
  certified: t("Chính hãng B.O.T Việt Nam", "Authentic B.O.T Vietnam"),
  visit: t("Ghé thăm chúng tôi", "Visit us"),
  directions: t("Chỉ đường", "Directions"),
};
