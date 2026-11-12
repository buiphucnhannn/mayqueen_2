"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { refreshPublicContent } from "@/lib/refresh-content";
import { cn } from "@/lib/utils";
import { ImageList } from "./ImageUpload";
import { createUploader } from "./pending-images";
import { LocalizedList, RowActions, rows, useSortable } from "./ListEditors";
import { href } from "@/i18n";
import { CategorySelect, useCategories } from "./Categories";
import { SlugFields } from "./SlugFields";
import { TranslateButton } from "./Translate";
import {
  AutoField,
  Button,
  Card,
  EditLangProvider,
  ErrorNote,
  Field,
  Input,
  LangTabs,
  LocalizedInput,
  MoneyInput,
  PageHeader,
  Select,
  Switch,
  emptyLoc,
  slugify,
  useConfirm,
  useToast,
} from "./ui";
import { useAutoSlugs } from "./useAutoSlugs";
import { fillLoc, filledLoc, trimLoc, useUnsavedGuard } from "./useFormGuard";

const LOC_FIELDS = [
  "name",
  "badge",
  "ritual",
  "tagline",
  "short",
  "description",
  "spec",
  "excipients",
];

const newOption = (optionId) => ({
  optionId,
  label: emptyLoc(),
  note: emptyLoc(),
  price: "",
  compareAt: "",
  popular: false,
});

const EMPTY = {
  category: "", // sản phẩm mới: tự chọn danh mục đầu tiên
  ...Object.fromEntries(LOC_FIELDS.map((k) => [k, emptyLoc()])),
  benefits: [],
  ingredients: [],
  usage: [],
  images: [],
  options: [newOption("1")],
  isActive: true,
};

/** Dữ liệu API → state form (đủ trường, số để trống thành "") */
function fromApi(p) {
  return {
    ...EMPTY,
    ...p,
    ...Object.fromEntries(LOC_FIELDS.map((k) => [k, fillLoc(p[k])])),
    benefits: p.benefits.map(fillLoc),
    usage: p.usage.map(fillLoc),
    ingredients: p.ingredients.map((g) => ({ name: fillLoc(g.name), note: fillLoc(g.note) })),
    options: p.options.map((o) => ({
      ...newOption(o.optionId),
      ...o,
      label: fillLoc(o.label),
      note: fillLoc(o.note),
      compareAt: o.compareAt ?? "",
    })),
  };
}

/** State form → body gửi API (bỏ dòng trống, ép kiểu số) */
function toApi(f) {
  return {
    category: f.category,
    ...Object.fromEntries(LOC_FIELDS.map((k) => [k, trimLoc(f[k])])),
    benefits: filledLoc(f.benefits).map(trimLoc),
    usage: filledLoc(f.usage).map(trimLoc),
    ingredients: f.ingredients
      .filter((g) => g.name.vi.trim())
      .map((g) => ({ name: trimLoc(g.name), note: trimLoc(g.note) })),
    images: f.images,
    options: f.options.map((o) => ({
      optionId: o.optionId,
      label: trimLoc(o.label),
      note: trimLoc(o.note),
      price: Number(o.price),
      ...(o.compareAt !== "" && Number(o.compareAt) > 0 && { compareAt: Number(o.compareAt) }),
      popular: o.popular,
    })),
    isActive: f.isActive,
  };
}

/** Kiểm tra nhanh trước khi gửi — thông báo tiếng Việt, chỉ đúng chỗ cần sửa */
function validate(f) {
  const errs = [];
  if (!f.name.vi.trim()) errs.push("Nhập tên sản phẩm (tiếng Việt).");
  if (!f.category) errs.push("Chọn danh mục.");
  if (!f.images.length) errs.push("Thêm ít nhất 1 ảnh sản phẩm.");
  if (!f.options.length) errs.push("Cần ít nhất 1 gói giá.");
  f.options.forEach((o, i) => {
    if (!o.label.vi.trim()) errs.push(`Gói ${i + 1}: nhập tên gói.`);
    if (o.price === "" || Number(o.price) <= 0) errs.push(`Gói ${i + 1}: nhập giá bán.`);
    if (o.compareAt !== "" && Number(o.compareAt) > 0 && Number(o.compareAt) <= Number(o.price))
      errs.push(`Gói ${i + 1}: giá gốc phải lớn hơn giá bán (hoặc để trống).`);
  });
  return errs.length
    ? {
        message: "Chưa lưu được — vui lòng kiểm tra:",
        details: errs.map((message) => ({ message })),
      }
    : null;
}

/**
 * Bảng gói giá: tên gói, ghi chú, giá bán, giá gốc (gạch ngang), gói phổ biến (chọn sẵn).
 * Mã gói do SERVER cấp lúc lưu (không bao giờ dùng lại mã gói đã xóa) — mã tạm ở đây chỉ để phân biệt các
 * dòng trong form; gói chưa lưu hiện "gói mới" thay vì một mã có thể khác sau khi lưu.
 */
function OptionsEditor({ value, onChange, savedIds = [] }) {
  // mã tạm: lớn hơn mọi mã đang có VÀ đã lưu (xóa gói #2 rồi thêm ngay không bị trùng "#2" cũ)
  const nextId = () =>
    String(
      Math.max(
        0,
        ...[...value.map((o) => o.optionId), ...savedIds].map(Number).filter(Number.isFinite),
      ) + 1,
    );
  const sort = useSortable(value, onChange);
  return (
    <div className="space-y-3">
      {value.map((o, i) => (
        <div
          key={o.optionId}
          {...sort.row(i)}
          className={cn("border-forest/10 border p-4", sort.rowClass(i))}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-forest text-sm font-semibold">
              Gói {i + 1}
              <span className="text-ink-muted ml-2 text-xs font-normal">
                {savedIds.includes(o.optionId) ? `mã #${o.optionId}` : "gói mới"}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onChange(value.map((x, j) => ({ ...x, popular: j === i ? !x.popular : false })))
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                  o.popular
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-forest/15 text-ink-muted hover:text-forest",
                )}
              >
                <Star className={cn("size-3.5", o.popular && "fill-current")} aria-hidden="true" />
                Phổ biến
              </button>
              <RowActions
                handle={sort.handle(i)}
                onRemove={() => onChange(rows.remove(value, i))}
              />
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tên gói" required>
              <LocalizedInput
                value={o.label}
                onChange={(label) => onChange(rows.update(value, i, { label }))}
                placeholder="VD: 1 lọ, Combo 1 - 2 lọ"
              />
            </Field>
            <Field label="Ghi chú">
              <LocalizedInput
                value={o.note}
                onChange={(note) => onChange(rows.update(value, i, { note }))}
                placeholder="VD: 30 viên, 1 MQ Slim + 1 Yodetox"
              />
            </Field>
            <Field label="Giá bán" required>
              <MoneyInput
                value={o.price}
                onChange={(price) => onChange(rows.update(value, i, { price }))}
              />
            </Field>
            <Field
              label="Giá gốc"
              hint="Để trống nếu không giảm giá — hiện gạch ngang cạnh giá bán."
            >
              <MoneyInput
                value={o.compareAt}
                onChange={(compareAt) => onChange(rows.update(value, i, { compareAt }))}
              />
            </Field>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, newOption(nextId())])}>
        <Plus className="size-4" aria-hidden="true" /> Thêm gói giá
      </Button>
      <p className="text-ink-muted text-xs">
        &ldquo;Phổ biến&rdquo; được gắn nhãn và chọn sẵn trên trang sản phẩm. Mã gói giữ cố định để
        đơn hàng cũ vẫn đúng.
      </p>
    </div>
  );
}

function IngredientsEditor({ value, onChange }) {
  const sort = useSortable(value, onChange);
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="text-ink-muted hidden grid-cols-[1fr_180px_104px] gap-2 px-1 text-[11px] font-semibold tracking-[0.1em] uppercase sm:grid">
          <span>Thành phần</span>
          <span>Hàm lượng / ghi chú</span>
        </div>
      )}
      {value.map((g, i) => (
        <div
          key={i}
          {...sort.row(i)}
          className={cn(
            "grid gap-2 sm:grid-cols-[1fr_180px_auto] sm:items-center",
            sort.rowClass(i),
          )}
        >
          <LocalizedInput
            value={g.name}
            onChange={(name) => onChange(rows.update(value, i, { name }))}
            placeholder="VD: Chiết xuất trà xanh"
          />
          <LocalizedInput
            value={g.note}
            onChange={(note) => onChange(rows.update(value, i, { note }))}
            placeholder="VD: 100 mg"
          />
          <RowActions handle={sort.handle(i)} onRemove={() => onChange(rows.remove(value, i))} />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { name: emptyLoc(), note: emptyLoc() }])}
      >
        <Plus className="size-4" aria-hidden="true" /> Thêm thành phần
      </Button>
    </div>
  );
}

export default function ProductForm({ id }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const isNew = !id;
  const [deleting, setDeleting] = useState(false); // nút Xóa ở thanh dưới
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [saved, setSaved] = useState(isNew ? EMPTY : null);
  const [lang, setLang] = useState("vi");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { done, total } khi đang tải ảnh lúc lưu
  const [error, setError] = useState(null);
  // đã bấm Lưu mà còn thiếu → hộp "vui lòng kiểm tra" tự cập nhật / tự ẩn khi người dùng sửa xong từng ô
  const [checking, setChecking] = useState(false);
  // Sản phẩm mới: điền sẵn danh mục đầu tiên (vẫn đổi được). Thứ tự hiển thị: server tự xếp cuối.
  const cats = useCategories("product", {
    onLoad: (list) => {
      if (!isNew) return;
      const fill = (f) => (f ? { ...f, category: f.category || list[0]?.slug || "" } : f);
      setForm(fill);
      setSaved(fill);
    },
  });

  // Thứ tự hiển thị: danh sách toàn bộ sản phẩm theo thứ tự hiện tại → vị trí = số thứ tự trong danh sách
  const [order, setOrder] = useState([]); // [{ id, name }]
  const [position, setPosition] = useState("");
  const version = useRef(null); // updatedAt của bản đang mở (chống ghi đè khi sửa cùng lúc ở nơi khác)

  useEffect(() => {
    if (isNew) return;
    Promise.all([api(`/products/manage/${id}`), api("/products/manage?limit=100")])
      .then(([r, all]) => {
        version.current = r.data.updatedAt ?? null;
        const f = fromApi(r.data);
        setForm(f);
        setSaved(f);
        const list = all.data.map((p) => ({ id: p.id, name: p.name.vi }));
        setOrder(list);
        setPosition(String(list.findIndex((p) => p.id === id) + 1));
      })
      .catch((err) => setError(err));
  }, [id, isNew]);

  const currentPos = order.findIndex((p) => p.id === id) + 1;
  const posNum = Number(position);
  const posValid = Number.isInteger(posNum) && posNum >= 1 && posNum <= order.length;
  const posChanged = !isNew && posValid && posNum !== currentPos;
  // sản phẩm đang ở vị trí muốn chuyển tới (để báo: nó và các sản phẩm giữa 2 vị trí dịch đi 1 bậc)
  const swapWith = posChanged ? order[posNum - 1] : null;

  const dirty = useMemo(
    () => (form && JSON.stringify(form) !== JSON.stringify(saved)) || posChanged,
    [form, saved, posChanged],
  );
  const leave = useUnsavedGuard(dirty);
  // Đường dẫn tự động theo tên sản phẩm (VI ngay, EN dịch sẵn) — xem useAutoSlugs
  const autoSlugs = useAutoSlugs({ form, saved, setForm, field: "name", isNew });

  if (!form)
    return (
      <div className="mx-auto max-w-6xl">
        {error ? (
          <ErrorNote error={error} />
        ) : (
          <Loader2 className="text-sage-600 mx-auto mt-24 size-6 animate-spin" />
        )}
      </div>
    );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setName = (name) => set({ name });
  const slugs = { slug: form.slug, slugEn: form.slugEn };

  const check = () =>
    validate(form) ??
    (!isNew && !posValid
      ? {
          message: "Chưa lưu được — vui lòng kiểm tra:",
          details: [{ message: `Thứ tự hiển thị phải là số từ 1 đến ${order.length}.` }],
        }
      : null);
  const save = async () => {
    const invalid = check();
    if (invalid) {
      setChecking(true);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setChecking(false);
    if (
      swapWith &&
      !(await confirm({
        title: `Chuyển tới vị trí ${posNum}?`,
        message: `“${form.name.vi}” sẽ hiện ở vị trí ${posNum} trên website. “${swapWith.name}” và các sản phẩm ${posNum < currentPos ? "phía sau" : "phía trước"} tự dịch đi 1 bậc (thứ tự giữa chúng giữ nguyên).`,
        confirmLabel: "Chuyển & lưu",
      }))
    )
      return;
    setSaving(true);
    setError(null);
    try {
      // 1) Ảnh chọn từ máy chỉ được tải lên lúc này (3 ảnh song song) → thay blob bằng URL Cloudinary
      const up = createUploader(
        "products",
        (done, total) => total && setUploadProgress({ done, total }),
      );
      await up.prepare(up.collect(form.images));
      const ready = { ...form, images: up.images(form.images) };
      // 2) Lưu sản phẩm
      const body = {
        ...toApi(ready),
        // tạo mới + tự động: để trống → server tự đặt đường dẫn tiếng Việt không trùng (thêm -2, -3…)
        slug: isNew && autoSlugs.auto.vi ? "" : slugs.slug,
        slugEn: slugs.slugEn || "",
      };
      const res = isNew
        ? await api("/products", { method: "POST", body })
        : await api(`/products/${id}`, {
            method: "PUT",
            // bản đang mở → server từ chối nếu đã có người lưu bản mới hơn (không ghi đè mất dữ liệu)
            body: { ...body, expectedUpdatedAt: version.current ?? undefined },
          });
      version.current = res.data.updatedAt ?? null;
      // Sản phẩm ĐÃ lưu ở bước trên → đổi thứ tự lỗi cũng không được bỏ qua bước làm mới website
      let orderFailed = false;
      if (swapWith) {
        try {
          // chuyển tới vị trí mới, các sản phẩm khác dịch theo (không đổi chỗ 2 sản phẩm)
          const ids = order.map((p) => p.id).filter((pid) => pid !== id);
          ids.splice(posNum - 1, 0, id);
          await api("/products/order", { method: "PUT", body: { ids } });
          const next = ids.map((pid) => order.find((p) => p.id === pid));
          setOrder(next.map((p) => (p.id === id ? { ...p, name: res.data.name.vi } : p)));
        } catch {
          orderFailed = true;
        }
      }
      const live = await refreshPublicContent("products");
      const f = fromApi(res.data);
      setForm(f);
      setSaved(f);
      toast(
        `${isNew ? "Đã thêm sản phẩm" : "Đã lưu"} — ${live ? "website đã cập nhật" : "website tự cập nhật trong vòng 1 giờ"}`,
      );
      if (orderFailed)
        toast("Chưa đổi được thứ tự hiển thị — hãy thử lại trong danh sách", "error");
      // lưu xong → tự thoát form, về danh sách (thông báo "Đã lưu" vẫn hiện — nằm ở khung Admin).
      // Sản phẩm mới: bỏ luôn trang "Thêm mới" khỏi lịch sử → Back không mở lại form trống
      if (isNew) leave.replaceTo("/admin/san-pham");
      else router.replace("/admin/san-pham");
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const back = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Bỏ các thay đổi chưa lưu?",
        confirmLabel: "Bỏ thay đổi",
        danger: true,
      }))
    )
      return;
    router.push("/admin/san-pham");
  };

  // Xóa ngay trong form (chỉ khi đang sửa) → về danh sách
  const remove = async () => {
    const ok = await confirm({
      title: `Xóa “${saved?.name?.vi || "sản phẩm này"}”?`,
      message:
        "Sản phẩm biến mất khỏi website và không khôi phục được. Đơn hàng cũ vẫn giữ nguyên thông tin. Muốn tạm ngừng bán thì nên tắt “Đang bán” thay vì xóa.",
      confirmLabel: "Xóa sản phẩm",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      await refreshPublicContent("products");
      toast(`Đã xóa “${saved?.name?.vi || "sản phẩm"}”`);
      router.push("/admin/san-pham");
    } catch (err) {
      toast(err.message, "error");
      setDeleting(false);
    }
  };

  return (
    <EditLangProvider value={lang}>
      <div className="mx-auto max-w-6xl pb-24">
        <button
          type="button"
          onClick={back}
          className="text-ink-soft hover:text-forest mb-5 flex w-fit items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Sản phẩm
        </button>
        <PageHeader
          eyebrow={isNew ? "Thêm mới" : "Chỉnh sửa"}
          // tên ĐÃ LƯU — gõ trong ô "Tên sản phẩm" chưa đổi tiêu đề cho tới khi bấm Lưu
          title={(!isNew && saved?.name?.vi) || "Sản phẩm mới"}
        >
          {/* chọn ngôn ngữ luôn nằm dưới tiêu đề (tiêu đề dài / ngắn đều cùng 1 chỗ) */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LangTabs value={lang} onChange={setLang} />
            {/* giữ sẵn chỗ (ẩn ở tab Tiếng Việt) → nút chọn ngôn ngữ không bị đẩy khi đổi tab */}
            <span className={lang === "en" ? "" : "invisible"} aria-hidden={lang !== "en"}>
              <TranslateButton form={form} setForm={setForm} />
            </span>
          </div>
        </PageHeader>
        {lang === "en" && (
          <p className="mt-3 rounded-xl bg-sky-50 px-4 py-2.5 text-xs text-sky-800">
            Đang nhập bản tiếng Anh (trang /en). Ô nào để trống, website dùng nội dung tiếng Việt.
          </p>
        )}

        <ErrorNote error={checking ? check() : error} className="mt-6" />

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card title="Thông tin sản phẩm">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên sản phẩm" required className="sm:col-span-2">
                  <LocalizedInput
                    value={form.name}
                    onChange={setName}
                    placeholder="VD: Mayqueen Slim"
                  />
                </Field>
                <Field
                  label="Loại sản phẩm"
                  hint="Hiện phía trên tên, VD: Thực phẩm bảo vệ sức khỏe"
                >
                  <LocalizedInput value={form.ritual} onChange={(ritual) => set({ ritual })} />
                </Field>
                <Field label="Quy cách" hint="VD: Dạng viên - 1 lọ 30 viên">
                  <LocalizedInput value={form.spec} onChange={(spec) => set({ spec })} />
                </Field>
                <Field
                  label="Khẩu hiệu"
                  hint="Dòng nghiêng dưới tên sản phẩm"
                  className="sm:col-span-2"
                >
                  <LocalizedInput value={form.tagline} onChange={(tagline) => set({ tagline })} />
                </Field>
                <Field
                  label="Mô tả ngắn"
                  hint="Hiện ở thẻ sản phẩm và đầu trang chi tiết"
                  className="sm:col-span-2"
                >
                  <LocalizedInput
                    multiline
                    rows={2}
                    value={form.short}
                    onChange={(short) => set({ short })}
                  />
                </Field>
                <Field
                  label="Mô tả chi tiết"
                  hint="Mục “Mô tả” trên trang sản phẩm"
                  className="sm:col-span-2"
                >
                  <LocalizedInput
                    multiline
                    rows={4}
                    value={form.description}
                    onChange={(description) => set({ description })}
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Hình ảnh"
              description="Ảnh đầu tiên là ảnh đại diện. Nên dùng ảnh vuông, tối thiểu 1200×1200px."
            >
              <ImageList value={form.images} onChange={(images) => set({ images })} />
            </Card>

            <Card title="Gói giá" description="Các lựa chọn khách chọn khi mua (1 lọ, combo...).">
              <OptionsEditor
                value={form.options}
                onChange={(options) => set({ options })}
                // sản phẩm mới: chưa có gói nào được lưu (gói "1" chỉ là mã tạm của form trống)
                savedIds={isNew ? [] : saved?.options?.map((o) => o.optionId)}
              />
            </Card>

            <Card title="Công dụng" description="Danh sách có dấu tích trên trang sản phẩm.">
              <LocalizedList
                value={form.benefits}
                onChange={(benefits) => set({ benefits })}
                placeholder="VD: Hỗ trợ giảm cân và giảm mỡ thừa"
                addLabel="Thêm công dụng"
              />
            </Card>

            <Card title="Thành phần">
              <IngredientsEditor
                value={form.ingredients}
                onChange={(ingredients) => set({ ingredients })}
              />
              <Field label="Phụ liệu / thành phần khác" className="mt-5">
                <LocalizedInput
                  multiline
                  rows={3}
                  value={form.excipients}
                  onChange={(excipients) => set({ excipients })}
                />
              </Field>
            </Card>

            <Card title="Cách dùng" description="Mỗi dòng là một gạch đầu dòng.">
              <LocalizedList
                value={form.usage}
                onChange={(usage) => set({ usage })}
                placeholder="VD: Uống 2 viên mỗi ngày."
                addLabel="Thêm dòng"
                multiline
              />
            </Card>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-8">
            <Card title="Hiển thị">
              <div className="space-y-5">
                <Switch
                  checked={form.isActive}
                  onChange={(isActive) => set({ isActive })}
                  label={form.isActive ? "Đang bán" : "Đang ẩn"}
                  description={
                    form.isActive
                      ? "Tắt để tạm ngừng bán — ẩn khỏi website, không đặt mua được."
                      : "Đang ẩn khỏi website. Bật lên rồi bấm Lưu để mở bán lại."
                  }
                />
                <CategorySelect
                  type="product"
                  value={form.category}
                  onChange={(category) => set({ category })}
                  cats={cats}
                />
                <Field label="Nhãn góc ảnh" hint="VD: Bán chạy, Mới — để trống nếu không cần">
                  <LocalizedInput value={form.badge} onChange={(badge) => set({ badge })} />
                </Field>
                <SlugFields
                  section="/san-pham"
                  value={slugs}
                  onChange={autoSlugs.onChange}
                  auto={autoSlugs.auto}
                  translating={autoSlugs.translating}
                  onAuto={autoSlugs.reAuto}
                  saved={isNew ? null : saved}
                  source="tên sản phẩm"
                />
                {!isNew && order.length > 0 && (
                  <Field
                    label="Thứ tự hiển thị"
                    error={!posValid ? `Nhập số từ 1 đến ${order.length}` : undefined}
                    hint={
                      swapWith
                        ? undefined
                        : `Vị trí ${currentPos} / ${order.length} trên website — số nhỏ hiện trước`
                    }
                  >
                    <Input
                      type="number"
                      min={1}
                      max={order.length}
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </Field>
                )}
                {swapWith && (
                  <div className="-mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      Khi lưu, sản phẩm này lên <b>vị trí {posNum}</b>; <b>{swapWith.name}</b> và
                      các sản phẩm {posNum < currentPos ? "phía sau" : "phía trước"} tự dịch đi 1
                      bậc.
                    </span>
                  </div>
                )}
              </div>
            </Card>
            {!isNew && saved.isActive && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/san-pham/${saved.slug}`, "_blank")}
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Xem trên website
              </Button>
            )}
          </aside>
        </div>

        {/* Thanh lưu cố định đáy màn hình */}
        <div className="border-forest/10 bg-pearl/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:left-[260px]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
            <span className="flex items-center gap-4">
              {!isNew && (
                <Button variant="danger" onClick={remove} loading={deleting}>
                  {!deleting && <Trash2 className="size-4" aria-hidden="true" />} Xóa
                </Button>
              )}
              <span className="text-ink-muted text-xs">
                {uploadProgress
                  ? `Đang tải ảnh lên ${uploadProgress.done}/${uploadProgress.total}…`
                  : dirty
                    ? "Có thay đổi chưa lưu"
                    : isNew
                      ? "Chưa lưu"
                      : "Đã lưu"}
              </span>
            </span>
            <span className="flex gap-2">
              <Button variant="ghost" onClick={back}>
                Hủy
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty && !isNew}>
                {isNew ? "Thêm sản phẩm" : "Lưu thay đổi"}
              </Button>
            </span>
          </div>
        </div>
      </div>
    </EditLangProvider>
  );
}
