"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquareHeart,
  Newspaper,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { LEAD_STATUS, ORDER_STATUS } from "./constants";
import { Badge, Button, ErrorNote, PageHeader, dateTime, useToast } from "./ui";

function Panel({ title, href, empty, children }) {
  return (
    <section className="bg-pearl shadow-card rounded-2xl">
      <header className="border-forest/10 flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-forest font-serif text-xl">{title}</h2>
        <Link
          href={href}
          className="text-sage-700 hover:text-forest inline-flex items-center gap-1 text-xs font-semibold"
        >
          Xem tất cả <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>
      {empty ? <p className="text-ink-muted px-6 py-10 text-center text-sm">{empty}</p> : children}
    </section>
  );
}

/** Tổng quan: việc cần xử lý + đơn hàng & yêu cầu tư vấn mới nhất */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAll = useCallback(
    () =>
      Promise.all([
        api("/orders?limit=6"),
        api("/orders/stats"),
        api("/leads?limit=6"),
        api("/leads/stats"),
        api("/products/manage?status=active&limit=1"),
        api("/articles/manage?status=published&limit=1"),
      ])
        .then(([orders, orderStats, leads, leadStats, products, articles]) => {
          setData({
            orders,
            orderStats: orderStats.data,
            leads,
            leadStats: leadStats.data,
            products,
            articles,
          });
          setError(null);
          return true;
        })
        .catch((err) => {
          setError(err);
          return false;
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stats = [
    {
      label: "Đơn chờ xác nhận",
      value: data?.orderStats.byStatus.pending ?? 0,
      sub:
        data &&
        `Tổng cộng ${data.orderStats.total} đơn${
          data.orderStats.awaitingPayment
            ? ` · ${data.orderStats.awaitingPayment} chờ chuyển khoản`
            : ""
        }`,
      href: "/admin/don-hang",
      Icon: ShoppingBag,
    },
    {
      label: "Tư vấn mới",
      value: data?.leadStats.byStatus.new ?? 0,
      sub: data && `Tổng cộng ${data.leadStats.total} yêu cầu`,
      href: "/admin/tu-van",
      Icon: MessageSquareHeart,
    },
    {
      label: "Sản phẩm đang bán",
      value: data?.products.meta.total,
      href: "/admin/san-pham",
      Icon: Package,
    },
    {
      label: "Bài viết đã đăng",
      value: data?.articles.meta.total,
      href: "/admin/bai-viet",
      Icon: Newspaper,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Bảng điều khiển"
        title="Tổng quan"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              // làm mới xong → thông báo (giống nút làm mới ở các trang danh sách)
              fetchAll().then((ok) =>
                ok
                  ? toast("Đã làm mới — dữ liệu mới nhất")
                  : toast("Không làm mới được, vui lòng thử lại", "error"),
              );
            }}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
            Làm mới
          </Button>
        }
      />

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-pearl shadow-card hover:ring-sage-300 flex items-center gap-4 rounded-2xl p-5 transition hover:ring-1"
          >
            <span className="bg-sage-100 text-sage-700 grid size-12 shrink-0 place-items-center rounded-full">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="text-ink-muted block text-xs font-medium tracking-[0.08em] uppercase">
                {label}
              </span>
              <span className="text-forest mt-1 block font-serif text-3xl leading-none [font-variant-numeric:lining-nums]">
                {value ?? (loading ? "…" : "—")}
              </span>
              {sub && <span className="text-ink-muted mt-1 block text-xs">{sub}</span>}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Đơn hàng mới"
          href="/admin/don-hang"
          empty={data && !data.orders.data.length && "Chưa có đơn hàng nào."}
        >
          <ul className="divide-forest/10 divide-y">
            {(data?.orders.data ?? []).map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <span className="min-w-0">
                  <span className="text-forest block font-semibold">
                    {o.code} - {o.customer.name}
                  </span>
                  <span className="text-ink-muted block text-xs">
                    {o.customer.phone} - {dateTime(o.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-forest text-sm font-semibold tabular-nums">
                    {formatPrice(o.total)}
                  </span>
                  <Badge tone={ORDER_STATUS[o.status]?.tone}>{ORDER_STATUS[o.status]?.label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Yêu cầu tư vấn"
          href="/admin/tu-van"
          empty={data && !data.leads.data.length && "Chưa có yêu cầu nào."}
        >
          <ul className="divide-forest/10 divide-y">
            {(data?.leads.data ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-6 py-4">
                <span className="min-w-0">
                  <span className="text-forest block truncate font-semibold">{l.name}</span>
                  <span className="text-ink-muted block truncate text-xs">
                    {l.phone}
                    {l.goal && ` - ${l.goal}`}
                  </span>
                </span>
                <Badge tone={LEAD_STATUS[l.status]?.tone}>{LEAD_STATUS[l.status]?.label}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
