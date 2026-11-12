import ErrorScreen from "@/components/ui/ErrorScreen";
import LoginLink from "./LoginLink";

export const metadata = { title: "Không có quyền truy cập" };

const copy = {
  code: "403",
  eyebrow: "Khu vực quản trị",
  title: "Bạn chưa có quyền truy cập",
  text: ["Trang này chỉ dành cho quản trị viên Mayqueen.", "Vui lòng đăng nhập để tiếp tục."],
  actions: [{ href: "/", label: "Về trang chủ" }],
};

/**
 * Proxy trả trang này (HTTP 403) khi vào /admin mà chưa đăng nhập.
 * Trang tĩnh hoàn toàn (không Suspense / searchParams) → vẽ đúng 1 lần, không giật.
 * Nút "Đăng nhập" tự lấy trang cần quay lại ở trình duyệt (xem LoginLink).
 */
export default function ForbiddenPage() {
  return (
    <ErrorScreen {...copy}>
      <LoginLink className="bg-pearl text-forest hover:bg-sage-100 inline-flex h-12 items-center justify-center rounded-full px-7 text-xs font-semibold tracking-[0.16em] uppercase transition-colors duration-300">
        Đăng nhập
      </LoginLink>
    </ErrorScreen>
  );
}
