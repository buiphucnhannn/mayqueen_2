"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { refreshPublicContent } from "@/lib/refresh-content";
import { articleBannerFallback } from "@/data/images";
import { ImageField } from "./ImageUpload";
import { createUploader } from "./pending-images";
import dynamic from "next/dynamic";

// TipTap sinh id ngẫu nhiên khi render → chỉ tải ở trình duyệt (không prerender)
const RichTextEditor = dynamic(() => import("./RichTextEditor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => (
    <div className="border-forest/15 grid min-h-[480px] place-items-center rounded-2xl border">
      <Loader2
        className="text-sage-500 size-6 animate-spin"
        aria-label="Đang tải trình soạn thảo"
      />
    </div>
  ),
});
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
  PageHeader,
  Select,
  Switch,
  dateOnly,
  emptyLoc,
  slugify,
  useConfirm,
  useToast,
} from "./ui";
import { useAutoSlugs } from "./useAutoSlugs";
import { fillLoc, filledLoc, trimLoc, useUnsavedGuard } from "./useFormGuard";

const EMPTY = {
  category: "", // bài mới: tự chọn danh mục đầu tiên
  title: emptyLoc(),
  excerpt: emptyLoc(),
  cover: null,
  banner: null,
  body: emptyLoc(), // HTML từ trình soạn thảo, song ngữ
  isPublished: true,
};

function fromApi(a) {
  return {
    ...EMPTY,
    ...a,
    title: fillLoc(a.title),
    excerpt: fillLoc(a.excerpt),
    banner: a.banner ?? null,
    body: fillLoc(a.body),
  };
}

function toApi(f) {
  return {
    category: f.category,
    title: trimLoc(f.title),
    excerpt: trimLoc(f.excerpt),
    cover: f.cover,
    banner: f.banner,
    body: { vi: f.body.vi, en: f.body.en },
    isPublished: f.isPublished,
  };
}

/** HTML có chữ hoặc ảnh (không chỉ là thẻ rỗng) */
const hasContent = (html = "") =>
  /<img/i.test(html) ||
  !!html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

function validate(f) {
  const errs = [];
  if (!f.title.vi.trim()) errs.push("Nhập tiêu đề bài viết (tiếng Việt).");
  if (!f.category) errs.push("Chọn danh mục.");
  if (!f.cover) errs.push("Chọn ảnh đại diện.");
  if (!hasContent(f.body.vi)) errs.push("Bài viết chưa có nội dung (tiếng Việt).");
  return errs.length
    ? {
        message: "Chưa lưu được — vui lòng kiểm tra:",
        details: errs.map((message) => ({ message })),
      }
    : null;
}

export default function ArticleForm({ id }) {
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
  const version = useRef(null); // updatedAt của bản đang mở (chống ghi đè khi sửa cùng lúc ở nơi khác)
  // Bài mới: điền sẵn danh mục đầu tiên (vẫn đổi được)
  const cats = useCategories("article", {
    onLoad: (list) => {
      if (!isNew) return;
      const fill = (f) => (f ? { ...f, category: f.category || list[0]?.slug || "" } : f);
      setForm(fill);
      setSaved(fill);
    },
  });

  useEffect(() => {
    if (isNew) return;
    api(`/articles/manage/${id}`)
      .then((r) => {
        version.current = r.data.updatedAt ?? null;
        const f = fromApi(r.data);
        setForm(f);
        setSaved(f);
      })
      .catch((err) => setError(err));
  }, [id, isNew]);

  const dirty = useMemo(
    () => form && JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );
  const leave = useUnsavedGuard(dirty);
  // Đường dẫn tự động theo tiêu đề (VI ngay, EN dịch sẵn) — xem useAutoSlugs
  const autoSlugs = useAutoSlugs({ form, saved, setForm, field: "title", isNew });

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
  const setTitle = (title) => set({ title });
  const slugs = { slug: form.slug, slugEn: form.slugEn };
  const check = () => validate(form);
  const save = async () => {
    const invalid = check();
    if (invalid) {
      setChecking(true);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setChecking(false);
    setSaving(true);
    setError(null);
    try {
      // 1) Ảnh chọn / dán từ máy chỉ được tải lên lúc này (3 ảnh song song) → thay blob bằng URL Cloudinary
      const up = createUploader(
        "articles",
        (done, total) => total && setUploadProgress({ done, total }),
      );
      await up.prepare(up.collect(form.cover, form.banner, form.body.vi, form.body.en));
      const ready = {
        ...form,
        cover: up.image(form.cover),
        banner: up.image(form.banner),
        body: { vi: up.html(form.body.vi), en: up.html(form.body.en) },
      };
      // 2) Lưu bài
      const body = {
        ...toApi(ready),
        // tạo mới + tự động: để trống → server tự đặt đường dẫn tiếng Việt không trùng (thêm -2, -3…)
        slug: isNew && autoSlugs.auto.vi ? "" : slugs.slug,
        slugEn: slugs.slugEn || "",
      };
      const res = isNew
        ? await api("/articles", { method: "POST", body })
        : await api(`/articles/${id}`, {
            method: "PUT",
            // bản đang mở → server từ chối nếu đã có người lưu bản mới hơn (không ghi đè mất dữ liệu)
            body: { ...body, expectedUpdatedAt: version.current ?? undefined },
          });
      version.current = res.data.updatedAt ?? null;
      const live = await refreshPublicContent("articles");
      const f = fromApi(res.data);
      setForm(f);
      setSaved(f);
      toast(
        `${isNew ? "Đã tạo bài viết" : "Đã lưu"} — ${live ? "website đã cập nhật" : "website tự cập nhật trong vòng 1 giờ"}`,
      );
      // lưu xong → tự thoát form, về danh sách (thông báo "Đã lưu" vẫn hiện — nằm ở khung Admin).
      // Bài mới: bỏ luôn trang "Viết bài mới" khỏi lịch sử → Back không mở lại form trống
      if (isNew) leave.replaceTo("/admin/bai-viet");
      else router.replace("/admin/bai-viet");
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
    router.push("/admin/bai-viet");
  };

  // Xóa ngay trong form (chỉ khi đang sửa) → về danh sách
  const remove = async () => {
    const ok = await confirm({
      title: `Xóa bài “${saved?.title?.vi || "bài viết này"}”?`,
      message:
        "Bài viết biến mất khỏi website và không khôi phục được. Muốn tạm ẩn thì chuyển sang “Bản nháp”.",
      confirmLabel: "Xóa bài viết",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/articles/${id}`, { method: "DELETE" });
      await refreshPublicContent("articles");
      toast(`Đã xóa bài “${saved?.title?.vi || "bài viết"}”`);
      router.push("/admin/bai-viet");
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
          <ArrowLeft className="size-4" aria-hidden="true" /> Bài viết
        </button>
        <PageHeader
          eyebrow={isNew ? "Viết bài mới" : "Chỉnh sửa bài viết"}
          // tiêu đề ĐÃ LƯU — gõ trong ô tiêu đề chưa đổi dòng này cho tới khi bấm Lưu
          title={(!isNew && saved?.title?.vi) || "Bài viết mới"}
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
            <Card title="Tiêu đề & tóm tắt">
              <div className="space-y-4">
                <Field label="Tiêu đề" required>
                  <LocalizedInput value={form.title} onChange={setTitle} />
                </Field>
                <Field label="Tóm tắt" hint="Hiện dưới tiêu đề và ở thẻ bài viết (1–2 câu)">
                  <LocalizedInput
                    multiline
                    rows={2}
                    value={form.excerpt}
                    onChange={(excerpt) => set({ excerpt })}
                  />
                </Field>
              </div>
            </Card>

            <Card title="Nội dung">
              {/* mỗi ngôn ngữ 1 bản nội dung (key → nạp đúng bản khi đổi tab) */}
              <RichTextEditor
                key={lang}
                value={form.body[lang]}
                onChange={(html) => set({ body: { ...form.body, [lang]: html } })}
                placeholder={
                  lang === "en"
                    ? "English content… (để trống → website dùng bản tiếng Việt)"
                    : "Viết nội dung bài… Dán / kéo ảnh vào để chèn ảnh giữa bài."
                }
              />
              {lang === "en" && !hasContent(form.body.vi) && (
                <span className="mt-1.5 block text-[11px] text-amber-700/80">
                  Chưa có bản tiếng Việt để dịch
                </span>
              )}
            </Card>

            <Card title="Hình ảnh">
              {/* 2 ảnh cao bằng nhau, ngang hàng: ảnh đại diện vuông + ảnh bìa ngang phần còn lại */}
              <div className="grid gap-5 sm:grid-cols-[13rem_1fr]">
                <Field as="div" label="Ảnh đại diện" required hint="Ảnh vuông — thẻ bài viết">
                  <ImageField
                    value={form.cover}
                    onChange={(cover) => set({ cover })}
                    aspect="size-52"
                  />
                </Field>
                <Field
                  as="div"
                  label="Ảnh bìa"
                  hint={
                    form.banner
                      ? "Ảnh ngang ~3:1 — đầu bài viết và thẻ bài nổi bật"
                      : "Đang dùng ảnh bìa chung — chọn ảnh ngang ~3:1 nếu muốn ảnh riêng"
                  }
                >
                  <ImageField
                    value={form.banner}
                    onChange={(banner) => set({ banner })}
                    aspect="h-52"
                    fallback={articleBannerFallback}
                    label="Chọn banner riêng"
                  />
                </Field>
              </div>
            </Card>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-8">
            <Card title="Đăng bài">
              <div className="space-y-5">
                <Switch
                  checked={form.isPublished}
                  onChange={(isPublished) => set({ isPublished })}
                  label={form.isPublished ? "Đã đăng" : "Bản nháp"}
                  description="Bản nháp không hiện trên website."
                />
                <CategorySelect
                  type="article"
                  label="Danh mục"
                  value={form.category}
                  onChange={(category) => set({ category })}
                  cats={cats}
                />
                <AutoField
                  label="Ngày đăng"
                  hint={saved.isPublished ? undefined : "Tự ghi lúc bài được đăng"}
                >
                  {saved.isPublished && saved.publishedAt
                    ? dateOnly(saved.publishedAt)
                    : "Khi bấm đăng"}
                </AutoField>
                <SlugFields
                  section="/song-dep"
                  value={slugs}
                  onChange={autoSlugs.onChange}
                  auto={autoSlugs.auto}
                  translating={autoSlugs.translating}
                  onAuto={autoSlugs.reAuto}
                  saved={isNew ? null : saved}
                />
              </div>
            </Card>
            {!isNew && saved.isPublished && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/song-dep/${saved.slug}`, "_blank")}
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Xem trên website
              </Button>
            )}
          </aside>
        </div>

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
                {isNew ? (form.isPublished ? "Đăng bài" : "Lưu nháp") : "Lưu thay đổi"}
              </Button>
            </span>
          </div>
        </div>
      </div>
    </EditLangProvider>
  );
}
