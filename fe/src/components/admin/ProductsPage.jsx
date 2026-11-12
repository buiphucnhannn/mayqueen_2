"use client";

import { useEffect, useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { ExternalLink, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { refreshPublicContent } from "@/lib/refresh-content";
import { cn, formatPrice } from "@/lib/utils";
import { CategoryButton, CategoryManager, useCategories } from "./Categories";
import {
  Badge,
  Button,
  ErrorNote,
  FilterTabs,
  IconButton,
  PageHeader,
  Pagination,
  RefreshButton,
  SearchBox,
  Select,
  Switch,
  TableShell,
  td,
  tdc,
  th,
  thc,
  useConfirm,
  useToast,
} from "./ui";
import { emptyMessage, useAdminList } from "./useAdminList";

export default function ProductsPage() {
  const list = useAdminList("/products/manage", { limit: 100 });
  const confirm = useConfirm();
  const toast = useToast();
  const cats = useCategories("product");
  const [managing, setManaging] = useState(false);
  const categoryTabs = [
    { value: "", label: "Tất cả" },
    ...cats.categories.map((c) => ({ value: c.slug, label: c.name.vi })),
  ];

  // Sắp xếp chỉ khi xem TOÀN BỘ sản phẩm (đang lọc / tìm / nhiều trang thì không thấy đủ vị trí)
  const canSort =
    !(list.params.category || list.params.status || list.params.q) &&
    list.meta?.total === list.items.length;
  const [drag, setDrag] = useState(null); // { from, over }

  // Cột "Thứ tự" = vị trí THẬT trên website (trong toàn bộ sản phẩm), kể cả khi đang lọc / tìm kiếm:
  // đang lọc → tải riêng danh sách đầy đủ để tra vị trí (sortOrder có thể bị "hổng" sau khi xóa)
  const [ranks, setRanks] = useState(null); // Map id → vị trí
  useEffect(() => {
    if (!list.filtered) return;
    let alive = true;
    api("/products/manage?limit=100")
      .then((r) => alive && setRanks(new Map(r.data.map((p, i) => [p.id, i + 1]))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [list.filtered, list.items]);
  const positionOf = (p, index) =>
    list.filtered
      ? (ranks?.get(p.id) ?? "–")
      : ((list.meta?.page ?? 1) - 1) * (list.meta?.limit ?? 0) + index + 1;

  /** Đưa sản phẩm ở vị trí from tới vị trí to, lưu thứ tự mới (1 lần gọi API) */
  const reorder = async (from, to) => {
    if (from === to) return;
    const next = [...list.items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    list.setItems(() => next.map((p, i) => ({ ...p, sortOrder: i + 1 })));
    try {
      await api("/products/order", { method: "PUT", body: { ids: next.map((p) => p.id) } });
      await refreshPublicContent("products");
      toast(`Đã chuyển “${moved.name.vi}” tới vị trí ${to + 1}`);
    } catch (err) {
      toast(err.message, "error");
      list.reload();
    }
  };

  const toggle = async (p) => {
    try {
      // chỉ đổi trạng thái hiển thị — KHÔNG gửi lại cả sản phẩm từ danh sách (có thể là bản cũ → ghi đè bản
      // vừa sửa ở tab khác, xoá mất ảnh mới thêm)
      const res = await api(`/products/${p.id}/active`, {
        method: "PATCH",
        body: { isActive: !p.isActive },
      });
      list.setItems((items) => items.map((x) => (x.id === p.id ? res.data : x)));
      await refreshPublicContent("products");
      toast(res.data.isActive ? `Đang bán “${p.name.vi}”` : `Đã ẩn “${p.name.vi}”`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: `Xóa “${p.name.vi}”?`,
      message:
        "Sản phẩm biến mất khỏi website và không khôi phục được. Đơn hàng cũ vẫn giữ nguyên thông tin. Muốn tạm ngừng bán thì nên tắt “Đang bán” thay vì xóa.",
      confirmLabel: "Xóa sản phẩm",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      list.setItems((items) => items.filter((x) => x.id !== p.id));
      await refreshPublicContent("products");
      toast(`Đã xóa “${p.name.vi}”`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Cửa hàng"
        title="Sản phẩm & gói giá"
        actions={
          <>
            <CategoryButton onClick={() => setManaging(true)} />
            <Button href="/admin/san-pham/moi">
              <Plus className="size-4" aria-hidden="true" /> Thêm sản phẩm
            </Button>
          </>
        }
      />

      {/* Lọc chính: tab danh mục (trái) — trạng thái + tìm kiếm gom gọn bên phải */}
      <div className="mt-8 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterTabs
          value={list.params.category ?? ""}
          onChange={(category) => list.update({ category })}
          items={categoryTabs}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            aria-label="Lọc theo trạng thái"
            value={list.params.status ?? ""}
            onChange={(e) => list.update({ status: e.target.value })}
            options={[
              { value: "", label: "Mọi trạng thái" },
              { value: "active", label: "Đang bán" },
              { value: "hidden", label: "Đang ẩn" },
            ]}
            className="rounded-full sm:w-44"
          />
          <div className="flex items-center gap-2">
            <SearchBox
              key={list.searchKey}
              defaultValue={list.params.q ?? ""}
              placeholder="Tên, đường dẫn…"
              onSearch={(q) => list.update({ q })}
              className="min-w-0 flex-1 sm:w-64 sm:flex-none"
            />
            <RefreshButton
              loading={list.loading}
              error={list.error}
              onClick={() => {
                list.refresh();
                cats.reload();
              }}
            />
          </div>
        </div>
      </div>

      <ErrorNote error={list.error} className="mt-4" />

      <div className="mt-4">
        <TableShell
          loading={list.loading}
          empty={emptyMessage(list, "Chưa có sản phẩm nào.")}
          // không chia trang / không đổi số dòng: kéo-thả sắp xếp cần thấy đủ mọi sản phẩm
          footer={<Pagination meta={list.meta} onPage={list.setPage} noun="sản phẩm" />}
        >
          <table className="w-full text-sm">
            <thead className="border-forest/10 border-b">
              <tr>
                <th className={th}>Sản phẩm</th>
                <th className={thc}>Danh mục</th>
                <th className={thc}>Giá bán</th>
                <th className={thc}>Thứ tự</th>
                <th className={thc}>Đang bán</th>
                <th className={thc}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-forest/10 divide-y">
              {list.items.map((p, index) => {
                // giá bán của 1 đơn vị (1 lọ / 1 hộp) = gói rẻ nhất
                const unitPrice = Math.min(...p.options.map((o) => o.price));
                return (
                  <tr
                    key={p.id}
                    draggable={canSort}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDrag({ from: index, over: index });
                    }}
                    onDragOver={(e) => {
                      if (!drag) return;
                      e.preventDefault();
                      if (drag.over !== index) setDrag({ ...drag, over: index });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag) reorder(drag.from, index);
                      setDrag(null);
                    }}
                    onDragEnd={() => setDrag(null)}
                    className={cn(
                      !p.isActive && "bg-linen/60",
                      drag?.from === index && "opacity-40",
                      // vạch xanh = chỗ sẽ thả
                      drag &&
                        drag.over === index &&
                        drag.from !== index &&
                        (drag.from < index
                          ? "shadow-[inset_0_-3px_0_var(--color-sage-500)]"
                          : "shadow-[inset_0_3px_0_var(--color-sage-500)]"),
                    )}
                  >
                    <td className={td}>
                      <Link
                        href={`/admin/san-pham/${p.id}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="bg-sand relative size-14 shrink-0 overflow-hidden rounded-xl">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].url}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="max-w-80 min-w-0" title={p.name.vi}>
                          <span className="text-forest group-hover:text-sage-700 block truncate font-semibold">
                            {p.name.vi}
                          </span>
                          <span className="text-ink-muted block truncate text-xs">/{p.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={tdc}>
                      <Badge tone="sage">{cats.labelOf(p.category)}</Badge>
                    </td>
                    <td className={cn(tdc, "whitespace-nowrap")}>
                      <span className="text-forest block font-semibold tabular-nums">
                        {formatPrice(unitPrice)}
                      </span>
                    </td>
                    <td className={cn(tdc, "text-ink-soft whitespace-nowrap")}>
                      {/* kéo tay nắm để thả vào vị trí bất kỳ */}
                      <span
                        title={canSort ? "Kéo để đổi vị trí" : "Bỏ lọc / tìm kiếm để sắp xếp"}
                        className={cn(
                          "inline-flex items-center gap-1 align-middle",
                          canSort ? "cursor-grab active:cursor-grabbing" : "opacity-40",
                        )}
                      >
                        <GripVertical className="size-4" aria-hidden="true" />
                        <span className="text-ink w-5 text-center font-semibold tabular-nums">
                          {positionOf(p, index)}
                        </span>
                      </span>
                    </td>
                    <td className={tdc}>
                      <span className="inline-flex">
                        <Switch
                          checked={p.isActive}
                          onChange={() => toggle(p)}
                          label=""
                          ariaLabel={`Đang bán: ${p.name.vi}`}
                        />
                      </span>
                    </td>
                    <td className={cn(tdc, "whitespace-nowrap")}>
                      <IconButton
                        label="Xem trên website"
                        onClick={() => window.open(`/san-pham/${p.slug}`, "_blank")}
                        disabled={!p.isActive}
                      >
                        <ExternalLink className="size-4" />
                      </IconButton>
                      <Link
                        href={`/admin/san-pham/${p.id}`}
                        aria-label="Sửa"
                        title="Sửa"
                        className="text-ink-muted hover:text-forest hover:bg-forest/5 inline-grid size-8 place-items-center rounded-full align-middle"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <IconButton
                        label="Xóa"
                        onClick={() => remove(p)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </div>
      <p className="text-ink-muted mt-3 text-xs">
        Thứ tự trong bảng là thứ tự hiển thị trên website — kéo biểu tượng ⋮⋮ để đổi vị trí (hoặc
        sửa số thứ tự trong trang sửa sản phẩm). Sản phẩm đang ẩn không hiện trên website và không
        đặt mua được.
      </p>
      <CategoryManager
        type="product"
        open={managing}
        onClose={() => setManaging(false)}
        cats={cats}
        onChanged={cats.reload}
      />
    </div>
  );
}
