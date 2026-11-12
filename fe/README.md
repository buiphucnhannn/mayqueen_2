# Mayqueen Slim — Website bán hàng D2C Wellness

Next.js 16 (App Router) · Tailwind CSS v4 · JavaScript thuần · Lenis (cuộn mượt). Song ngữ Việt / Anh.
Yêu cầu dự án: [docs/demo.docx](docs/demo.docx) · Web tham khảo: thebeautychef.com

## Bắt đầu

```bash
npm install
cp .env.example .env.local   # chỉnh NEXT_PUBLIC_SITE_URL
npm run dev                  # http://localhost:3000
```

| Lệnh             | Mô tả                             |
| ---------------- | --------------------------------- |
| `npm run dev`    | Chạy môi trường phát triển        |
| `npm run build`  | Build production                  |
| `npm run start`  | Chạy bản build                    |
| `npm run lint`   | Kiểm tra ESLint                   |
| `npm run format` | Format toàn bộ code bằng Prettier |

## Trang & đường dẫn

| Trang             | Tiếng Việt           | English               |
| ----------------- | -------------------- | --------------------- |
| Trang chủ         | `/`                  | `/en`                 |
| Cửa hàng          | `/san-pham`          | `/en/shop`            |
| Chi tiết sản phẩm | `/san-pham/[slug]`   | `/en/shop/[slug]`     |
| Sống đẹp (blog)   | `/song-dep`          | `/en/journal`         |
| Bài viết          | `/song-dep/[slug]`   | `/en/journal/[slug]`  |
| Thanh toán        | `/thanh-toan`        | `/en/checkout`        |
| Chính sách        | `/chinh-sach/[slug]` | `/en/policies/[slug]` |
| Tra cứu đơn hàng  | `/tra-cuu-don-hang`  | `/en/track-order`     |

Route thật nằm ở `src/app/[lang]/<đoạn tiếng Việt>`; `next.config.mjs` rewrite URL về đó.
Trong code luôn viết đường dẫn tiếng Việt và bọc bằng `href(lang, path)`.

## Cấu trúc thư mục

```
public/images/
├── brand/       logo B.O.T Việt Nam: bản gốc + PNG trong suốt (ngang, dọc, trắng, dấu B)
├── products/    ảnh sản phẩm 2000px — mayqueen-slim/, yodetox/
└── social/      ảnh bài đăng Facebook 206px (chỉ dùng cỡ nhỏ: feed, thumbnail)
public/icons/    icon PWA

src/
├── app/
│   ├── [lang]/            layout gốc + các trang (vi, en)
│   ├── api/lead/          nhận đăng ký tư vấn + nhận tin
│   ├── api/order/         nhận đơn hàng (tính lại giá ở server)
│   ├── icon.png, apple-icon.png, opengraph-image.js, sitemap.js, robots.js, manifest.js
│   └── globals.css        design tokens (sage / leaf / forest / cream / pearl) + CSS hiệu ứng
├── components/
│   ├── fx/        SmoothScroll (Lenis), Reveal, Parallax, SplitText, ScrollWords, Marquee, Preloader
│   ├── ui/        Button, Container, Logo, Price, Stars, SectionHeading, Icon, BrandIcons, Ornaments
│   ├── layout/    AnnouncementBar, Header, LanguageSwitcher, Footer, PageHero
│   ├── sections/  các khối trang chủ: Hero, QuickAccess, Bestsellers, Ritual, Story, Journey, ...
│   ├── product/   ProductCard, ProductGallery, ProductPurchase (chọn combo, Mua ngay)
│   ├── cart/      CartDrawer (giỏ hàng trượt), QtyStepper
│   ├── blog/      ArticleCard, ArticleList (lọc chuyên mục)
│   ├── forms/     ConsultForm, CheckoutForm, NewsletterForm
│   └── common/    ConsultModal (popup tư vấn — mở bằng data-consult), FloatingContact, BackToTop
├── config/site.js     thông tin doanh nghiệp: hotline, địa chỉ, bản đồ, mạng xã hội, phí ship
├── context/           CartContext (giỏ hàng)
├── data/              NỘI DUNG song ngữ: products, articles, home, faqs, testimonials, policies, ui, images
├── hooks/useReveal.js hiệu ứng hiện dần khi cuộn (Web Animations API)
├── i18n/              localize(), href(), bảng dịch đường dẫn
└── lib/               utils, cartStore (localStorage), scroll
```

## Quy ước

- **Nội dung tách khỏi giao diện**: mọi chữ, giá, bài viết nằm trong `src/data/` dạng `t("Tiếng Việt", "English")`.
- **Ảnh**: lấy đường dẫn từ `src/data/images.js`, không viết tay `/images/...` trong component.
- **Hiệu ứng**: thêm class `reveal` (tuỳ chọn `data-reveal="left|right|scale|clip"`, `style={{ "--reveal-delay": "120ms" }}`) để phần tử hiện dần khi cuộn tới. Vùng cuộn riêng đặt `data-lenis-prevent`.
- **Giỏ hàng** lưu `localStorage`; server luôn tính lại giá khi nhận đơn.
- **Popup tư vấn**: thêm thuộc tính `data-consult` vào bất kỳ nút/link nào để mở popup đăng ký tư vấn.
- **Hero**: slide trong `src/data/home.js` (`hero.slides`), mỗi slide có `bg` = màu viền ảnh để ảnh hoà vào nền.

## Việc cần làm trước khi go-live

- [ ] Xác nhận **giá bán, thành phần, quy cách** trong `src/data/products.js` (đang là dữ liệu demo)
- [ ] Thay **đánh giá khách hàng** mẫu trong `src/data/testimonials.js` bằng phản hồi thật
- [ ] Bổ sung **link TikTok** thật trong `src/config/site.js`
- [ ] Nối `api/lead` và `api/order` với nơi lưu thật (Google Sheets / email / CRM / Telegram)
- [ ] Rà soát nội dung **chính sách** (`src/data/policies.js`) và số giấy công bố của B.O.T
- [ ] Đặt `NEXT_PUBLIC_SITE_URL` là domain thật khi deploy
