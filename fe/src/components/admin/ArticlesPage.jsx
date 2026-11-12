"use client";

import { useState } from "react";
import Image from "@/components/ui/Img";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { refreshPublicContent } from "@/lib/refresh-content";
import { cn } from "@/lib/utils";
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
  TableShell,
  dateOnly,
  td,
  tdc,
  th,
  thc,
  useConfirm,
  useToast,
} from "./ui";
import { emptyMessage, useAdminList } from "./useAdminList";

export default function ArticlesPage() {
  const list = useAdminList("/articles/manage");
  const confirm = useConfirm();
  const toast = useToast();
  const cats = useCategories("article");
  const [managing, setManaging] = useState(false);
  const categoryTabs = [
    { value: "", label: "Tất cả" },
    ...cats.categories.map((c) => ({ value: c.slug, label: c.name.vi })),
  ];

  const remove = async (a) => {
    const ok = await confirm({
      title: `Xóa bài “${a.title.vi}”?`,
      message:
        "Bài viết biến mất khỏi website và không khôi phục được. Muốn tạm ẩn thì chuyển sang “Bản nháp”.",
      confirmLabel: "Xóa bài viết",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/articles/${a.id}`, { method: "DELETE" });
      list.setItems((items) => items.filter((x) => x.id !== a.id));
      await refreshPublicContent("articles");
      toast(`Đã xóa bài “${a.title.vi}”`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Sống đẹp cùng Mayqueen"
        title="Bài viết"
        actions={
          <>
            <CategoryButton onClick={() => setManaging(true)} />
            <Button href="/admin/bai-viet/moi">
              <Plus className="size-4" aria-hidden="true" /> Viết bài mới
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
              { value: "published", label: "Đã đăng" },
              { value: "draft", label: "Bản nháp" },
            ]}
            className="rounded-full sm:w-44"
          />
          <div className="flex items-center gap-2">
            <SearchBox
              key={list.ready ? "ready" : "init"}
              defaultValue={list.params.q ?? ""}
              placeholder="Tiêu đề, đường dẫn…"
              onSearch={(q) => list.update({ q })}
              className="min-w-0 flex-1 sm:w-64 sm:flex-none"
            />
            <RefreshButton
              loading={list.loading}
              error={list.error}
              onClick={() => {
                list.reload();
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
          empty={emptyMessage(list, "Chưa có bài viết nào.")}
          footer={
            <Pagination
              meta={list.meta}
              onPage={list.setPage}
              onLimit={list.setLimit}
              noun="bài viết"
            />
          }
        >
          <table className="w-full text-sm">
            <thead className="border-forest/10 border-b">
              <tr>
                <th className={th}>Bài viết</th>
                <th className={thc}>Danh mục</th>
                <th className={thc}>Ngày đăng</th>
                <th className={thc}>Trạng thái</th>
                <th className={thc}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-forest/10 divide-y">
              {list.items.map((a) => (
                <tr key={a.id} className={cn(!a.isPublished && "bg-linen/60")}>
                  <td className={td}>
                    <Link
                      href={`/admin/bai-viet/${a.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className="bg-sand relative size-14 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={a.cover.url}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </span>
                      <span className="max-w-[420px] min-w-0" title={a.title.vi}>
                        <span className="text-forest group-hover:text-sage-700 block truncate font-semibold">
                          {a.title.vi}
                        </span>
                        <span className="text-ink-muted block truncate text-xs">/{a.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={tdc}>
                    <Badge tone="sage">{cats.labelOf(a.category)}</Badge>
                  </td>
                  <td className={cn(tdc, "text-ink-soft text-xs whitespace-nowrap")}>
                    {dateOnly(a.publishedAt)}
                  </td>
                  <td className={tdc}>
                    {a.isPublished ? <Badge tone="green">Đã đăng</Badge> : <Badge>Bản nháp</Badge>}
                  </td>
                  <td className={cn(tdc, "whitespace-nowrap")}>
                    <IconButton
                      label="Xem trên website"
                      onClick={() => window.open(`/song-dep/${a.slug}`, "_blank")}
                      disabled={!a.isPublished}
                    >
                      <ExternalLink className="size-4" />
                    </IconButton>
                    <Link
                      href={`/admin/bai-viet/${a.id}`}
                      aria-label="Sửa"
                      title="Sửa"
                      className="text-ink-muted hover:text-forest hover:bg-forest/5 inline-grid size-8 place-items-center rounded-full align-middle"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <IconButton
                      label="Xóa"
                      onClick={() => remove(a)}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>
      <p className="text-ink-muted mt-3 text-xs">
        Bài mới nhất (theo ngày đăng) là bài nổi bật đầu trang &ldquo;Sống đẹp&rdquo;.
      </p>
      <CategoryManager
        type="article"
        open={managing}
        onClose={() => setManaging(false)}
        cats={cats}
        onChanged={cats.reload}
      />
    </div>
  );
}
