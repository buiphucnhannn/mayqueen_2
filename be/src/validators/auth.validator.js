import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập").max(100),
  password: z.string().min(1, "Vui lòng nhập mật khẩu").max(200),
  // "Ghi nhớ đăng nhập": true = giữ phiên qua các lần tắt trình duyệt; false = hết khi đóng trình duyệt
  remember: z.boolean().optional().default(false),
});
