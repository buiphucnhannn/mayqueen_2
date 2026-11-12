"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, GripVertical, Languages, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { refreshPublicContent } from "@/lib/refresh-content";
import { cn } from "@/lib/utils";
import {
  Button,
  ErrorNote,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
  useConfirm,
  useEscLayer,
  useToast,
} from "./ui";

/** Tên danh mục tối đa 40 ký tự — khớp be/src/validators/category.validator.js */
const NAME_MAX = 40;

/** Chữ hiển thị theo loại danh mục */
export const CATEGORY_TEXT = {
  product: { title: "Danh mục sản phẩm", item: "sản phẩm", one: "danh mục" },
  // Thống nhất 1 tên gọi "danh mục" cho cả sản phẩm lẫn bài viết
  article: { title: "Danh mục bài viết", item: "bài viết", one: "danh mục" },
};

/** Danh mục của 1 loại (kèm số sản phẩm / bài viết đang dùng). onLoad(list) chạy mỗi lần tải xong. */
export function useCategories(type, { onLoad } = {}) {
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  });
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api(`/categories/manage?type=${type}`)
      .then((r) => {
        if (!alive) return;
        setCategories(r.data);
        setLoaded(true);
        onLoadRef.current?.(r.data);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [type, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const labelOf = useCallback(
    (slug) => categories.find((c) => c.slug === slug)?.name.vi ?? slug,
    [categories],
  );
  return { categories, loaded, reload, labelOf };
}

/** Ô nhập tên song ngữ dùng chung cho form thêm / sửa danh mục */
function NameFields({ value, onChange, autoFocus }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  // Dịch tên tiếng Việt → tiếng Anh (cùng API dịch với form sản phẩm / bài viết)
  const translate = async () => {
    if (!value.vi.trim()) return toast("Nhập tên tiếng Việt trước", "error");
    setBusy(true);
    try {
      const res = await api("/translate", {
        method: "POST",
        body: { texts: [value.vi], from: "vi", to: "en" },
      });
      onChange({ ...value, en: (res.data[0] ?? "").slice(0, NAME_MAX) });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Tên (tiếng Việt)" required>
        <Input
          value={value.vi}
          autoFocus={autoFocus}
          maxLength={NAME_MAX}
          onChange={(e) => onChange({ ...value, vi: e.target.value })}
          placeholder="VD: Hỗ trợ giảm béo"
        />
        <span className="text-ink-muted mt-1 block text-xs">
          Ngắn gọn để hiện đẹp trên tab lọc ({value.vi.length}/{NAME_MAX} ký tự)
        </span>
      </Field>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-ink text-[13px] font-semibold">Tên (English)</span>
          <button
            type="button"
            onClick={translate}
            disabled={busy}
            className="text-sage-700 hover:text-forest inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
          >
            <Languages className="size-3.5" aria-hidden="true" />{" "}
            {busy ? "Đang dịch…" : "Dịch tự động"}
          </button>
        </div>
        <Input
          value={value.en}
          maxLength={NAME_MAX}
          aria-label="Tên (English)"
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder="VD: Weight support"
        />
        <span className="text-ink-muted mt-1 block text-xs">Để trống → dùng tên tiếng Việt</span>
      </div>
    </div>
  );
}

const trimName = (n) => ({ vi: n.vi.trim(), en: n.en.trim() });

/** Gọi API tạo danh mục (dùng chung cho popup quản lý + tạo nhanh) */
async function createCategory(type, name) {
  const res = await api("/categories", { method: "POST", body: { type, name: trimName(name) } });
  await refreshPublicContent("categories");
  return res.data;
}

/** Popup tạo nhanh — mở từ form sản phẩm / bài viết, tạo xong tự chọn danh mục mới */
export function QuickCreateCategory({ type, open, onClose, onCreated }) {
  const [name, setName] = useState({ vi: "", en: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const text = CATEGORY_TEXT[type];

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.vi.trim()) return setError({ message: `Nhập tên ${text.one}` });
    setSaving(true);
    setError(null);
    try {
      const cat = await createCategory(type, name);
      toast(`Đã tạo ${text.one} “${cat.name.vi}”`);
      setName({ vi: "", en: "" });
      onCreated(cat);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tạo ${text.one} mới`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} loading={saving}>
            Tạo và chọn
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />
        <NameFields value={name} onChange={setName} autoFocus />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/** 1 dòng danh mục trong popup quản lý: xem / sửa tên tại chỗ */
function CategoryRow({ cat, type, dragProps, dragClass, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState({ vi: cat.name.vi, en: cat.name.en ?? "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const text = CATEGORY_TEXT[type];

  // Hủy sửa: trả lại tên cũ. Esc lúc đang sửa chỉ hủy ô sửa này (không đóng cả popup Danh mục)
  const cancel = () => {
    setEditing(false);
    setName({ vi: cat.name.vi, en: cat.name.en ?? "" });
  };
  useEscLayer(editing, cancel);

  const save = async (e) => {
    e?.preventDefault();
    if (saving) return;
    if (!name.vi.trim()) return toast(`Nhập tên ${text.one}`, "error");
    setSaving(true);
    try {
      await api(`/categories/${cat.id}`, { method: "PATCH", body: { name: trimName(name) } });
      await refreshPublicContent("categories");
      setEditing(false);
      onSaved();
      toast(`Đã đổi tên ${text.one} thành “${name.vi.trim()}”`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (editing)
    return (
      <li className="bg-sage-50/60 px-4 py-4">
        {/* <form>: Enter trong ô tên = Lưu */}
        <form onSubmit={save} className="space-y-3">
          <NameFields value={name} onChange={setName} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="size-4" aria-hidden="true" /> Hủy
            </Button>
            <Button type="submit" size="sm" onClick={save} loading={saving}>
              <Check className="size-4" aria-hidden="true" /> Lưu
            </Button>
          </div>
        </form>
      </li>
    );

  return (
    <li {...dragProps} className={cn("flex items-center gap-3 px-4 py-3", dragClass)}>
      <span
        title="Kéo để đổi vị trí"
        className="text-ink-muted shrink-0 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-forest block truncate font-semibold">{cat.name.vi}</span>
        <span className="text-ink-muted block truncate text-xs">{cat.name.en || "—"}</span>
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
          cat.count ? "bg-sage-100 text-sage-800" : "bg-stone/60 text-ink-muted",
        )}
      >
        {cat.count} {text.item}
      </span>
      <span className="flex shrink-0 items-center">
        <IconButton label="Đổi tên" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton
          label={cat.count ? `Đang có ${cat.count} ${text.item} — không xóa được` : "Xóa"}
          disabled={cat.count > 0}
          onClick={onDelete}
          className="hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </IconButton>
      </span>
    </li>
  );
}

/** Popup quản lý danh mục: thêm, đổi tên, sắp xếp, xóa */
export function CategoryManager({ type, open, onClose, cats, onChanged }) {
  const [name, setName] = useState({ vi: "", en: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const confirm = useConfirm();
  const toast = useToast();
  const text = CATEGORY_TEXT[type];
  const list = cats.categories;

  const add = async (e) => {
    e?.preventDefault();
    if (!name.vi.trim()) return setError({ message: `Nhập tên ${text.one}` });
    setAdding(true);
    setError(null);
    try {
      const cat = await createCategory(type, name);
      setName({ vi: "", en: "" });
      toast(`Đã thêm ${text.one} “${cat.name.vi}”`);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setAdding(false);
    }
  };

  // Kéo-thả: hiện thứ tự mới ngay (pending) trong lúc lưu; danh sách tải lại khớp thì thôi dùng pending
  const [drag, setDrag] = useState(null); // { from, over }
  const [pending, setPending] = useState(null); // [id] thứ tự vừa thả
  const settled = pending && list.map((c) => c.id).join() === pending.join();
  const shown =
    pending && !settled ? pending.map((id) => list.find((c) => c.id === id)).filter(Boolean) : list;

  const reorder = async (from, to) => {
    if (from === to) return;
    const next = [...shown];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const ids = next.map((c) => c.id);
    setPending(ids);
    try {
      await api("/categories/order", { method: "PUT", body: { type, ids } });
      await refreshPublicContent("categories");
      onChanged();
    } catch (err) {
      setPending(null);
      toast(err.message, "error");
    }
  };

  const dragFor = (i) => ({
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.effectAllowed = "move";
      setDrag({ from: i, over: i });
    },
    onDragOver: (e) => {
      if (!drag) return;
      e.preventDefault();
      if (drag.over !== i) setDrag({ ...drag, over: i });
    },
    onDrop: (e) => {
      e.preventDefault();
      if (drag) reorder(drag.from, i);
      setDrag(null);
    },
    onDragEnd: () => setDrag(null),
  });
  const dragClassFor = (i) =>
    cn(
      drag?.from === i && "opacity-40",
      drag &&
        drag.over === i &&
        drag.from !== i &&
        (drag.from < i
          ? "shadow-[inset_0_-3px_0_var(--color-sage-500)]"
          : "shadow-[inset_0_3px_0_var(--color-sage-500)]"),
    );

  const remove = async (cat) => {
    const ok = await confirm({
      title: `Xóa ${text.one} “${cat.name.vi}”?`,
      message: "Danh mục biến mất khỏi website và bộ lọc. Không khôi phục được.",
      confirmLabel: `Xóa ${text.one}`,
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/categories/${cat.id}`, { method: "DELETE" });
      await refreshPublicContent("categories");
      toast(`Đã xóa ${text.one} “${cat.name.vi}”`);
      onChanged();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={text.title}
      description={`Kéo biểu tượng ⋮⋮ để đổi vị trí — đây cũng là thứ tự tab lọc trên website. Chỉ xóa được ${text.one} chưa có ${text.item} nào.`}
    >
      <form onSubmit={add} className="border-forest/10 bg-linen/50 rounded-xl border p-4">
        <p className="text-forest mb-3 text-sm font-semibold">Thêm {text.one}</p>
        <ErrorNote error={error} className="mb-3" />
        <NameFields value={name} onChange={setName} />
        <div className="mt-3 flex justify-end">
          <Button type="submit" size="sm" loading={adding} onClick={add}>
            <Plus className="size-4" aria-hidden="true" /> Thêm
          </Button>
        </div>
      </form>

      <ul className="border-forest/10 divide-forest/10 mt-5 divide-y rounded-xl border">
        {shown.map((cat, i) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            type={type}
            dragProps={dragFor(i)}
            dragClass={dragClassFor(i)}
            onSaved={onChanged}
            onDelete={() => remove(cat)}
          />
        ))}
        {cats.loaded && !list.length && (
          <li className="text-ink-muted px-4 py-8 text-center text-sm">Chưa có {text.one} nào.</li>
        )}
      </ul>
    </Modal>
  );
}

/** Nút "Danh mục" đặt ở đầu trang Sản phẩm / Bài viết */
export function CategoryButton({ onClick }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <Tags className="size-4" aria-hidden="true" /> Danh mục
    </Button>
  );
}

/**
 * Ô chọn danh mục trong form: chỉ chọn danh mục đang có + liên kết tạo nhanh.
 * Tự vẽ nhãn bằng <div> (không bọc trong <Field>/<label>): popup tạo nhanh nằm bên trong, nếu ở trong
 * <label> thì bấm vào popup sẽ kích hoạt ô chọn phía sau.
 */
export function CategorySelect({ type, value, onChange, cats, label = "Danh mục" }) {
  const [creating, setCreating] = useState(false);
  const text = CATEGORY_TEXT[type];
  return (
    <div>
      <span className="text-ink mb-1.5 block text-[13px] font-semibold">
        {label}
        <span className="ml-0.5 text-red-600">*</span>
      </span>
      <Select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={[
          ...(value ? [] : [{ value: "", label: `— Chọn ${text.one} —` }]),
          ...cats.categories.map((c) => ({ value: c.slug, label: c.name.vi })),
        ]}
      />
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="text-sage-700 hover:text-forest mt-1.5 inline-flex items-center gap-1 text-xs font-semibold"
      >
        <Plus className="size-3.5" aria-hidden="true" /> Tạo {text.one} mới
      </button>
      <QuickCreateCategory
        type={type}
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(cat) => {
          setCreating(false);
          cats.reload();
          onChange(cat.slug);
        }}
      />
    </div>
  );
}
