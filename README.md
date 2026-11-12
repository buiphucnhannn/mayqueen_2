# Mayqueen Slim

Website bán hàng D2C Mayqueen Slim · Yodetox Extra — gồm 2 phần độc lập:

| Thư mục         | Công nghệ                                      | Cổng dev | Tài liệu                     |
| --------------- | ---------------------------------------------- | -------- | ---------------------------- |
| [`fe/`](fe)     | Next.js 16 · Tailwind CSS v4 · song ngữ VI/EN  | `3000`   | [fe/README.md](fe/README.md) |
| [`be/`](be)     | Express 5 · MongoDB Atlas · Cloudinary         | `4000`   | [be/README.md](be/README.md) |
| [`docs/`](docs) | Yêu cầu dự án, hồ sơ chứng nhận (không commit) |          |                              |

## Chạy nhanh

```bash
npm run install:all          # cài fe + be

cp fe/.env.example fe/.env.local
cp be/.env.example be/.env   # điền MongoDB, Cloudinary, ADMIN_API_KEY

npm run dev:be               # http://localhost:4000/api/v1/health
npm run dev:fe               # http://localhost:3000   (mở terminal khác)
```

Mỗi thư mục có `package.json` và `node_modules` riêng → deploy tách biệt
(vd. `fe` lên Vercel với _Root Directory_ = `fe`, `be` lên Render/Railway với root = `be`).
