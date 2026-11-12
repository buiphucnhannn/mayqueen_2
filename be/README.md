# Mayqueen Slim — API (be)

Express 5 · MongoDB Atlas (Mongoose) · Cloudinary · Zod · Pino. JavaScript ES Modules, Node ≥ 22.

## Bắt đầu

```bash
cd be
npm install
cp .env.example .env      # điền MONGODB_URI, CLOUDINARY_*
npm run seed              # đưa dữ liệu ban đầu (3 sản phẩm + 6 bài viết, ảnh lên Cloudinary) vào DB
npm run dev               # http://localhost:4000/api/v1
npm run secret            # (khi deploy) tạo JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
```

| Lệnh             | Mô tả                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| `npm run dev`    | Chạy dev, tự khởi động lại khi sửa code                                    |
| `npm start`      | Chạy production                                                            |
| `npm run seed`   | Thêm sản phẩm + bài viết ban đầu (ảnh lên Cloudinary); `-- --force` ghi đè |
| `npm run lint`   | ESLint                                                                     |
| `npm run format` | Prettier                                                                   |

### Lấy key

- **MongoDB Atlas**: Database → Connect → Drivers → copy chuỗi `mongodb+srv://…` vào `MONGODB_URI`.
  Nhớ thêm IP máy / server vào _Network Access_.
- **Cloudinary**: Console → Dashboard → API Keys → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
  Chưa điền thì app vẫn chạy, riêng API upload trả `503`.

## Kiến trúc phân lớp

```
request → routes → middlewares (validate, auth, upload) → controller → service → repository → model (MongoDB)
```

| Lớp             | Trách nhiệm                                                   | Không được làm                 |
| --------------- | ------------------------------------------------------------- | ------------------------------ |
| `routes/`       | Khai báo URL, gắn middleware + controller                     | Chứa logic                     |
| `validators/`   | Schema Zod kiểm tra body / query / params                     |                                |
| `controllers/`  | Đọc request đã validate → gọi service → trả response          | Gọi DB, viết nghiệp vụ         |
| `services/`     | Nghiệp vụ: tính giá, phí ship, chống trùng, upload Cloudinary | Dùng `req`/`res`, gọi Mongoose |
| `repositories/` | Truy vấn MongoDB (kế thừa `BaseRepository`)                   | Chứa nghiệp vụ                 |
| `models/`       | Mongoose schema                                               |                                |

```
be/
├── .env.example
└── src/
    ├── server.js            # khởi động: Cloudinary → MongoDB → listen, tắt êm (SIGINT/SIGTERM)
    ├── app.js               # Express app: helmet, cors, compression, rate limit, log, routes, lỗi
    ├── config/              # env (kiểm tra bằng Zod), database, cloudinary, logger
    ├── models/              # product, order, lead (+ shared.schema: chuỗi song ngữ, ảnh)
    ├── repositories/        # base.repository + product / order / lead
    ├── services/            # product / order / lead / upload
    ├── controllers/         # product / order / lead / upload / health
    ├── routes/              # index.js gom tất cả dưới /api/v1
    ├── validators/          # schema Zod theo từng module
    ├── middlewares/         # validate, auth (chỗ giữ cho đăng nhập), upload (multer), error + 404
    ├── utils/               # ApiError, response, pagination, phone, serialize
    └── scripts/             # seed.js + seed-data/*.json (dữ liệu ban đầu)
```

**Thêm một module mới** (vd. `article`): `models/article.model.js` → `repositories/article.repository.js`
→ `services/article.service.js` → `validators/article.validator.js` → `controllers/article.controller.js`
→ `routes/article.routes.js` → gắn vào `routes/index.js`.

## API (`/api/v1`)

Phản hồi thống nhất: `{ success: true, data, meta? }` · lỗi: `{ success: false, error: { message, details? } }`.
Route **admin** cần đăng nhập (cookie HttpOnly do `/auth/login` cấp). Mọi request POST/PATCH/DELETE phải có header
`X-Requested-With: fetch` (chống CSRF) — `fe/src/lib/api.js` đã tự gửi.

| Method | Đường dẫn                               | Quyền    | Mô tả                                                                                |
| ------ | --------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| GET    | `/health`                               | public   | Trạng thái server, DB, Cloudinary                                                    |
| GET    | `/slugs`                                | public   | Slug sản phẩm / bài viết đang hiển thị (proxy Next dùng)                             |
| POST   | `/auth/login`                           | public   | Đăng nhập `{ username, password }` → set cookie                                      |
| POST   | `/auth/refresh`                         | public   | Làm mới phiên (xoay vòng refresh token)                                              |
| GET    | `/auth/resume?next=`                    | public   | Làm mới rồi 303 về trang cũ (proxy Next dùng)                                        |
| POST   | `/auth/logout`                          | admin    | Đăng xuất, thu hồi phiên                                                             |
| GET    | `/auth/me`                              | admin    | Thông tin tài khoản đang đăng nhập                                                   |
| GET    | `/products?category=`                   | public   | Sản phẩm đang bán                                                                    |
| GET    | `/products/:slug`                       | public   | Chi tiết sản phẩm                                                                    |
| GET    | `/products/manage?category=&status=&q=` | admin    | Danh sách quản trị (cả sản phẩm đang ẩn)                                             |
| GET    | `/products/manage/:id`                  | admin    | Chi tiết để sửa                                                                      |
| POST   | `/products`                             | admin    | Tạo sản phẩm                                                                         |
| PUT    | `/products/:id`                         | admin    | Lưu sản phẩm (gửi đủ form)                                                           |
| PUT    | `/products/order`                       | admin    | Lưu thứ tự mới `{ ids }` (toàn bộ sản phẩm — kéo-thả trong Admin)                    |
| DELETE | `/products/:id`                         | admin    | Xoá sản phẩm                                                                         |
| GET    | `/articles?category=`                   | public   | Bài viết đã đăng, mới nhất trước                                                     |
| GET    | `/articles/:slug`                       | public   | Chi tiết bài viết                                                                    |
| GET    | `/articles/manage?category=&status=&q=` | admin    | Danh sách quản trị (cả bản nháp)                                                     |
| GET    | `/articles/manage/:id`                  | admin    | Chi tiết để sửa                                                                      |
| POST   | `/articles`                             | admin    | Tạo bài viết                                                                         |
| PUT    | `/articles/:id`                         | admin    | Lưu bài viết                                                                         |
| DELETE | `/articles/:id`                         | admin    | Xoá bài viết                                                                         |
| GET    | `/categories?type=product               | article` | public                                                                               | Danh mục sản phẩm / chuyên mục bài viết |
| GET    | `/categories/manage?type=`              | admin    | Danh mục kèm số sản phẩm / bài viết đang dùng                                        |
| POST   | `/categories`                           | admin    | Tạo danh mục `{ type, name }` (slug tự sinh, cố định)                                |
| PATCH  | `/categories/:id`                       | admin    | Đổi tên `{ name }` / thứ tự `{ sortOrder }`                                          |
| DELETE | `/categories/:id`                       | admin    | Xoá (chỉ khi chưa có sản phẩm / bài viết nào)                                        |
| POST   | `/orders`                               | public   | Đặt hàng (COD) — giá tính lại ở server                                               |
| GET    | `/orders/track/:code?phone=`            | public   | Khách tra cứu đơn bằng mã + SĐT                                                      |
| GET    | `/orders?status=&q=&page=`              | admin    | Danh sách đơn (q: mã đơn / SĐT / tên)                                                |
| GET    | `/orders/stats`                         | admin    | Số đơn theo trạng thái                                                               |
| GET    | `/orders/:id`                           | admin    | Chi tiết đơn                                                                         |
| PATCH  | `/orders/:id`                           | admin    | Đổi trạng thái `{ status }` và/hoặc ghi chú `{ adminNote }`                          |
| POST   | `/leads`                                | public   | Đăng ký tư vấn (chống gửi trùng 10 phút / SĐT)                                       |
| GET    | `/leads?status=&q=&page=`               | admin    | Danh sách đăng ký tư vấn                                                             |
| GET    | `/leads/stats`                          | admin    | Số yêu cầu theo trạng thái                                                           |
| PATCH  | `/leads/:id/status`                     | admin    | Đổi trạng thái tư vấn                                                                |
| POST   | `/uploads/images?folder=products`       | admin    | Upload ảnh lên Cloudinary (form-data `files`)                                        |
| DELETE | `/uploads/images`                       | admin    | Xoá ảnh `{ publicId }`                                                               |
| POST   | `/translate`                            | admin    | Dịch tự động `{ texts, from: "vi", to: "en" }` (Google Translate gtx, không cần key) |

Ví dụ đặt hàng (payload giống form thanh toán ở frontend):

```json
POST /api/v1/orders
{
  "customer": { "name": "Nguyễn A", "phone": "0912345678", "address": "12 Trần Phú, Hà Đông" },
  "items": [{ "slug": "mayqueen-slim", "optionId": "3", "qty": 1 }],
  "lang": "vi"
}
→ 201 { "success": true, "data": { "orderId": "MQ7K3P9X", "total": 1190000 } }
```

## Log

- Local: 1 dòng / request (`GET /api/v1/products 200 · 92ms`). Production: JSON (`level`, `time`, `reqId`, `req`, `res`, `msg`).
- Mỗi request có `reqId` (header `X-Request-Id` trả về client) → đối chiếu lỗi với log.
- Không ghi header, cookie, body, query; khoá nhạy cảm (`password`, `token`, `cookie`...) tự che `[REDACTED]`.
- Sự kiện có trường `event` để lọc: `auth.login`, `auth.login_failed`, `auth.logout`, `auth.token_reuse`,
  `security.csrf_rejected`, `security.bad_origin`, `security.rate_limited`, `product.*`, `article.*`,
  `order.update`, `lead.status`, `upload.*` (kèm `actor`, `ip`).
- `LOG_LEVEL=debug | info | warn | error`.

## Sao lưu tự động (MongoDB)

**3 lần / tuần, giữ 3 bản gần nhất, lưu ngay trên hosting cPanel** tại `~/backups/mayqueen/`. Thư mục này nằm
ngoài thư mục app nên deploy không làm mất.

| Lệnh (chạy trong thư mục app)                              | Việc làm                                                |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| `npm run backup`                                           | Sao lưu ngay (cron cũng gọi lệnh này)                   |
| `npm run backup:list`                                      | Liệt kê các bản đang có                                 |
| `npm run restore -- latest`                                | **Xem trước** khôi phục bản mới nhất (chưa thay đổi gì) |
| `npm run restore -- latest --yes`                          | Khôi phục bản mới nhất                                  |
| `npm run restore -- <tên file> --yes`                      | Khôi phục đúng 1 bản                                    |
| `npm run restore -- latest --only=orders,leads --yes`      | Chỉ khôi phục vài bảng                                  |
| `npm run restore -- latest --to-db=mayqueen_xem_lai --yes` | Khôi phục sang DB khác để xem lại, DB thật giữ nguyên   |

Mỗi bản sao lưu là 1 file `mayqueen-<db>-YYYY-MM-DD_HHmm.ndjson.gz` (giờ Việt Nam), gồm toàn bộ các bảng:
products, orders, leads, articles, categories… và index. Phiên đăng nhập không sao lưu.

**Cơ chế an toàn**

- Ghi xong thì đọc lại toàn bộ file để kiểm tra (giải nén được, đủ số tài liệu). Chỉ khi kiểm tra đạt mới tính là thành công.
- Bản cũ chỉ bị xóa **sau** khi bản mới thành công. Sao lưu lỗi thì các bản cũ còn nguyên.
- Sao lưu lỗi thì gửi email báo admin qua Resend (`ADMIN_NOTIFY_EMAILS`) và ghi `~/backups/mayqueen/backup.log`.
- File chỉ tài khoản hosting đọc được (quyền 600 / 700) vì có dữ liệu khách hàng.
- Khôi phục: tự sao lưu dữ liệu hiện tại trước khi ghi đè (`truoc-khoi-phuc-…`, giữ 2 bản), nên khôi phục nhầm vẫn quay lại được.
- Có khóa chống 2 lần chạy chồng nhau.
- Đổi cấu hình bằng biến môi trường: `BACKUP_DIR` (thư mục lưu), `BACKUP_KEEP` (số bản giữ, mặc định 3).

### Cài lịch chạy trên cPanel (làm 1 lần)

1. Mở **cPanel → Setup Node.js App → app `mayqueen-api`**. Ở đầu trang có dòng
   `source /home/<user>/nodevenv/mayqueen-api/<phiên bản>/bin/activate && cd /home/<user>/mayqueen-api`.
   Copy dòng đó.
2. Mở **cPanel → Cron Jobs → Add New Cron Job**:
   - **Common Settings**: chọn tùy chỉnh, điền Minute `30`, Hour `2`, Day `*`, Month `*`, Weekday `1,3,5`
     (tức 02:30 sáng Thứ 2, Thứ 4, Thứ 6).
   - **Command**: dòng vừa copy, nối thêm `&& node scripts/backup.js >/dev/null 2>&1`. Ví dụ:
     ```
     source /home/<user>/nodevenv/mayqueen-api/22/bin/activate && cd /home/<user>/mayqueen-api && node scripts/backup.js >/dev/null 2>&1
     ```
3. Kiểm tra múi giờ máy chủ: mở **Terminal**, gõ `date`.
   - Nếu hiện `+07` là đúng giờ Việt Nam.
   - Nếu hiện `UTC`, đổi thành Hour `19`, Weekday `0,2,4` (vẫn là 02:30 sáng Thứ 2, 4, 6 giờ Việt Nam).
4. Chạy thử 1 lần: **Setup Node.js App → Run JS script → `backup`** (hoặc Terminal: dán dòng ở bước 1 rồi gõ
   `npm run backup`). Kết quả là có file mới trong `~/backups/mayqueen/`.

**Hai site** (`mayqueen-api` và `mayqueen-api-vn`):

- Nếu `.env` của hai app dùng **cùng** `MONGODB_URI` và `MONGODB_DB_NAME`, chỉ cần 1 cron như trên.
- Nếu khác DB, thêm cron thứ hai với đường dẫn `mayqueen-api-vn` và đặt thư mục riêng ở đầu lệnh:
  `export BACKUP_DIR=$HOME/backups/mayqueen-vn && source ... && cd ... && node scripts/backup.js >/dev/null 2>&1`.

**Tải bản sao lưu về máy:** cPanel → File Manager → `backups/mayqueen` → chọn file → Download.

**Khôi phục (khi cần):**

1. Mở **cPanel → Terminal**, dán dòng `source … && cd …` ở bước 1.
2. Gõ `npm run backup:list` để chọn bản.
3. Gõ `npm run restore -- latest` để xem trước.
4. Thêm `--yes` để thực hiện.
5. Khôi phục xong, vào trang quản trị bấm lưu 1 sản phẩm bất kỳ (hoặc chờ vài phút) để website cập nhật dữ liệu mới.

## Đăng nhập quản trị

- **Tài khoản** khai báo trong `.env`: `ADMIN_ID`, `ADMIN_PASSWORD`, `ADMIN_NAME`. So khớp bằng `timingSafeEqual`.
  Đổi ID / mật khẩu → mọi phiên cũ tự mất hiệu lực.
- **JWT HS256** (`jsonwebtoken`): access 15 phút + refresh 7 ngày, 2 secret riêng (`npm run secret`), có `issuer`/`audience`/`typ`.
- **Cookie HttpOnly + SameSite=Strict** (`mq_at`, `mq_rt` chỉ gửi tới `/api/v1/auth`, `mq_session`); production thêm `Secure` +
  tiền tố `__Host-`/`__Secure-`. Token không bao giờ nằm trong body / localStorage.
- **Phiên lưu MongoDB** (chỉ lưu hash SHA-256 của refresh token), xoay vòng mỗi lần làm mới; dùng lại token cũ sau 30s →
  coi là bị đánh cắp, thu hồi toàn bộ phiên. Tối đa `MAX_SESSIONS` thiết bị.
- **Chống dò mật khẩu**: 5 lần sai / 15 phút / IP, 10 lần / tài khoản, 50 lần toàn hệ thống (chỉ đếm lần sai).
- **Chống CSRF**: SameSite=Strict + bắt buộc header `X-Requested-With: fetch` + kiểm tra Origin.
- **Production** bắt buộc: 2 secret ≥ 32 ký tự và khác nhau, `ADMIN_ID`, `ADMIN_PASSWORD` ≥ 12 ký tự (thiếu → không khởi động).

## Bảo mật đã bật sẵn

Helmet (header bảo mật) · CORS chỉ cho domain trong `CORS_ORIGINS` · rate limit chung `RATE_LIMIT_MAX` / 15 phút / IP ·
giới hạn body 1MB · ảnh tối đa 8MB, chỉ nhận JPEG/PNG/WebP/AVIF/GIF · Zod loại bỏ trường lạ ·
giá đơn hàng không nhận từ client · lỗi 500 ẩn chi tiết ở production.
