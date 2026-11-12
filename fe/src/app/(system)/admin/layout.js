import AdminShell from "@/components/admin/AdminShell";
import { siteConfig } from "@/config/site";

// Tab khu quản trị: "Đơn hàng – Quản trị | Mayqueen Slim" (phân biệt ngay với tab trang bán hàng)
export const metadata = {
  title: { default: "Tổng quan", template: `%s – Quản trị | ${siteConfig.name}` },
};

// Truy cập /admin đã được src/proxy.js kiểm tra đăng nhập TRƯỚC khi render.
export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
