/**
 * Tạo 2 secret ngẫu nhiên cho JWT (dán vào be/.env):
 *   npm run secret
 */
import { randomBytes } from "node:crypto";

const secret = () => randomBytes(48).toString("base64url");
console.log(`JWT_ACCESS_SECRET=${secret()}`);
console.log(`JWT_REFRESH_SECRET=${secret()}`);
// Mã "khóa cửa sau": dán CÙNG giá trị vào Render (backend) và Vercel (frontend)
console.log(`PROXY_SECRET=${secret()}`);
