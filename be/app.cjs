/**
 * Điểm khởi động cho hosting cPanel (Setup Node.js App — LiteSpeed / Passenger).
 * LiteSpeed nạp file khởi động bằng require() (CommonJS), còn backend là ES module có top-level await
 * → require thẳng src/server.js báo ERR_REQUIRE_ASYNC_MODULE. File này nạp server bằng import() nên chạy được.
 * Trong cPanel đặt "Application startup file" = app.cjs. Chạy local vẫn dùng `npm run dev` / `npm start` như cũ.
 */
process.chdir(__dirname); // đọc đúng .env trong thư mục app dù hosting chạy từ thư mục khác

import("./src/server.js").catch((err) => {
  console.error("[startup] Không khởi động được backend:", err);
  process.exit(1);
});
