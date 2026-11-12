"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareHeart,
  Newspaper,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import { brand } from "@/data/images";
import { api } from "@/lib/api";
import { skipNextPreloader } from "@/lib/preloader";
import { cn } from "@/lib/utils";
import { AdminProviders, useEscLayer } from "./ui";
import { confirmLeave } from "./useFormGuard";
import { TODO_EVENT } from "./useAdminList";

// count: số việc cần xử lý hiện cạnh menu (đơn chờ xác nhận, yêu cầu tư vấn mới)
const NAV = [
  { href: "/admin", label: "Tổng quan", Icon: LayoutDashboard },
  { href: "/admin/don-hang", label: "Đơn hàng", Icon: ShoppingBag, count: "orders" },
  { href: "/admin/tu-van", label: "Yêu cầu tư vấn", Icon: MessageSquareHeart, count: "leads" },
  { href: "/admin/san-pham", label: "Sản phẩm & gói giá", Icon: Package },
  { href: "/admin/bai-viet", label: "Bài viết", Icon: Newspaper },
];

const isActive = (pathname, href) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

/** Logo về trang chủ — cùng 1 website nên không hiện lại màn chào */
function HomeLogo({ className }) {
  return (
    <Link href="/" onClick={skipNextPreloader} aria-label="Về trang chủ" className={className}>
      <Image
        src={brand.horizontalWhite}
        alt="B.O.T"
        width={357}
        height={136}
        className="h-8 w-auto"
      />
    </Link>
  );
}

/** Mục menu — pathname chỉ có lúc chạy (route động [id]) nên nằm riêng trong <Suspense> */
function ActiveNavLinks({ todo, onNavigate }) {
  const pathname = usePathname();
  return NAV.map((item) => (
    <NavItem
      key={item.href}
      item={item}
      todo={todo}
      onNavigate={onNavigate}
      active={isActive(pathname, item.href)}
    />
  ));
}

/** Đổi trang → gọi onChange 1 lần (cập nhật số việc cần xử lý). Render đúng 1 bản trong khung. */
function RouteWatcher({ onChange }) {
  const pathname = usePathname();
  useEffect(() => {
    onChange(pathname);
  }, [pathname, onChange]);
  return null;
}

function NavItem({ item: { href, label, Icon, count }, todo, onNavigate, active }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-pearl/10 text-pearl" : "text-pearl/65 hover:bg-pearl/5 hover:text-pearl",
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {count && todo[count] > 0 && (
        <span className="bg-leaf text-forest-deep min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold">
          {todo[count]}
        </span>
      )}
    </Link>
  );
}

/**
 * Khung khu quản trị: thanh bên (desktop) / thanh trên (mobile), tên người dùng, đăng xuất.
 * Quyền truy cập đã được proxy kiểm tra trước khi render; đây chỉ lấy thông tin hiển thị.
 */
export default function AdminShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [todo, setTodo] = useState({});

  useEffect(() => {
    api("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => router.replace("/login"));
  }, [router]);

  // Số đơn chờ xác nhận / tư vấn mới — tải lại mỗi lần đổi trang (sau khi xử lý xong số tự giảm)
  const loadTodo = useCallback(() => {
    Promise.all([api("/orders/stats"), api("/leads/stats")])
      .then(([o, l]) =>
        setTodo({ orders: o.data.byStatus.pending ?? 0, leads: l.data.byStatus.new ?? 0 }),
      )
      .catch(() => {});
  }, []);

  // đổi trạng thái / xóa ở trang Đơn hàng, Tư vấn → cập nhật số ngay, không chờ chuyển trang
  useEffect(() => {
    window.addEventListener(TODO_EVENT, loadTodo);
    return () => window.removeEventListener(TODO_EVENT, loadTodo);
  }, [loadTodo]);

  // menu trượt trên điện thoại: Esc để đóng
  useEscLayer(open, () => setOpen(false));

  const logout = async () => {
    // đang sửa form chưa lưu → hỏi trước (như khi bấm link rời trang)
    if (!(await confirmLeave())) return;
    setOpen(false);
    setLeaving(true);
    try {
      await api("/auth/logout", { method: "POST", retry: false });
    } catch {
      // phiên đã hết hạn sẵn → vẫn coi như đăng xuất
    }
    router.replace("/login");
    router.refresh();
  };

  // Avatar: chữ cái đầu của tên đăng nhập (admin → A)
  const initials = (user?.username || "A").charAt(0).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 pt-7 pb-8">
        <HomeLogo />
        <span className="text-sage-300 border-pearl/15 border-l pl-3 text-[10px] font-semibold tracking-[0.28em] uppercase">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <Suspense
          fallback={NAV.map((item) => (
            <NavItem key={item.href} item={item} todo={todo} active={false} />
          ))}
        >
          <ActiveNavLinks todo={todo} onNavigate={() => setOpen(false)} />
        </Suspense>
      </nav>

      <div className="border-pearl/10 m-3 rounded-2xl border p-3">
        <div className="flex items-center gap-3">
          <span className="bg-sage-600 text-pearl grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
            {user ? initials : <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="text-pearl block truncate text-sm font-semibold">
              {user?.name ?? "…"}
            </span>
            <span className="text-pearl/50 block truncate text-xs">{user?.username ?? ""}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={leaving}
          className="text-pearl/80 hover:bg-pearl hover:text-forest border-pearl/15 mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full border text-xs font-semibold tracking-[0.14em] uppercase transition-colors disabled:opacity-60"
        >
          {leaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell bg-linen min-h-svh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="bg-moss sticky top-0 hidden h-svh lg:block">{sidebar}</aside>

      {/* Mobile top bar + drawer */}
      <header className="bg-moss text-pearl sticky top-0 z-40 flex h-16 items-center justify-between px-4 lg:hidden">
        <HomeLogo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          className="bg-sage-600 grid size-10 place-items-center rounded-md"
        >
          <Menu className="size-5" />
        </button>
      </header>
      <div
        className={cn(
          "fixed inset-0 z-50 transition lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "bg-forest-deep/60 absolute inset-0 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "bg-moss absolute inset-y-0 left-0 w-[280px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
            className="text-pearl/70 hover:text-pearl absolute top-6 right-4 grid size-9 place-items-center"
          >
            <X className="size-5" />
          </button>
          {sidebar}
        </aside>
      </div>

      <Suspense>
        <RouteWatcher onChange={loadTodo} />
      </Suspense>
      {/* [overflow-wrap:anywhere]: chuỗi dài không khoảng trắng (tên, địa chỉ, ghi chú khách nhập…) tự xuống dòng,
          không tràn khung — kể cả trong hàng flex / bảng */}
      <main className="min-w-0 px-5 py-8 [overflow-wrap:anywhere] sm:px-8 lg:px-12 lg:py-12">
        <AdminProviders>{children}</AdminProviders>
      </main>
    </div>
  );
}
