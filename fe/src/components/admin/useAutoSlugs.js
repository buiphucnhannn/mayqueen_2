"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { slugify } from "./ui";

const TRANSLATE_DELAY = 700; // gõ xong ~0,7 giây mới dịch (API dịch giới hạn 30 lần / phút)

/**
 * Đường dẫn TỰ ĐỘNG theo tiêu đề / tên (bài viết, sản phẩm) — cả khi tạo mới lẫn khi sửa:
 * - Đổi tiêu đề tiếng Việt → đường dẫn tiếng Việt đổi NGAY; đường dẫn tiếng Anh được DỊCH SẴN từ tiêu đề
 *   (chờ gõ xong ~0,7s rồi gọi API dịch).
 * - Sửa tiêu đề ở tab English → đường dẫn tiếng Anh theo tiêu đề tiếng Anh đó.
 * - Trả tiêu đề về như đã lưu → đường dẫn trở lại như cũ.
 * - Người dùng sửa tay ô đường dẫn → tắt tự động ô đó (bật lại bằng "Dùng lại tự động").
 * Link cũ không hỏng: backend lưu đường dẫn cũ (oldSlugs) và tự chuyển hướng 308 sang đường dẫn mới.
 *
 * form.slug / form.slugEn được cập nhật trực tiếp → cảnh báo "chưa lưu" và nút Lưu nhận biết thay đổi.
 * @param field "title" (bài viết) | "name" (sản phẩm)
 */
export function useAutoSlugs({ form, saved, setForm, field, isNew }) {
  const [auto, setAuto] = useState({ vi: true, en: true });
  const [translating, setTranslating] = useState(false);
  const titleVi = form?.[field]?.vi ?? "";
  const titleEn = form?.[field]?.en ?? "";
  const prev = useRef(null); // tiêu đề lần trước (null = chưa tải dữ liệu)
  const req = useRef(0); // mã lượt dịch mới nhất → bỏ kết quả cũ về muộn
  const timer = useRef(null);
  const latest = useRef({});

  const patch = useCallback((p) => setForm((f) => (f ? { ...f, ...p } : f)), [setForm]);
  const same = (a, b) => (a ?? "").trim() === (b ?? "").trim();

  // giá trị mới nhất cho các effect / hàm dịch (cập nhật trước mọi effect bên dưới)
  useEffect(() => {
    latest.current = { saved, isNew, auto, titleVi, titleEn };
  });

  // dữ liệu vừa tải / vừa lưu → mốc so sánh mới
  useEffect(() => {
    if (saved) prev.current = { vi: saved[field]?.vi ?? "", en: saved[field]?.en ?? "" };
  }, [saved, field]);

  /** Đường dẫn tiếng Anh: dịch tiêu đề tiếng Việt (chờ gõ xong) */
  const translateEn = useCallback(
    (vi, delay = TRANSLATE_DELAY) => {
      clearTimeout(timer.current);
      const id = ++req.current;
      if (!vi.trim()) {
        setTranslating(false);
        patch({ slugEn: "" });
        return;
      }
      setTranslating(true);
      timer.current = setTimeout(async () => {
        let en = "";
        try {
          const res = await api("/translate", {
            method: "POST",
            body: { texts: [vi], from: "vi", to: "en" },
          });
          en = slugify(res.data?.[0] ?? "");
        } catch {
          // dịch lỗi (mạng / quá giới hạn 30 lần/phút) → tạm dùng tiêu đề tiếng Việt không dấu (luôn khớp
          // tiêu đề mới; tiêu đề tiếng Anh cũ có thể đã lỗi thời). Bấm "Dùng lại tự động" để dịch lại sau.
          en = slugify(vi);
        }
        if (id !== req.current) return; // đã có lượt mới hơn
        setTranslating(false);
        if (en) patch({ slugEn: en });
      }, delay);
    },
    [patch],
  );

  // Tiêu đề tiếng Việt đổi → đường dẫn tiếng Việt ngay, tiếng Anh dịch sẵn
  useEffect(() => {
    if (!prev.current || titleVi === prev.current.vi) return;
    prev.current = { ...prev.current, vi: titleVi };
    const { saved, isNew, auto } = latest.current;
    const back = !isNew && saved && same(titleVi, saved[field]?.vi); // trả về tiêu đề đã lưu
    if (auto.vi) patch({ slug: back ? saved.slug : slugify(titleVi) });
    if (!auto.en) return;
    if (back) {
      clearTimeout(timer.current);
      req.current++;
      setTranslating(false);
      patch({ slugEn: saved.slugEn });
    } else translateEn(titleVi);
  }, [titleVi, field, patch, translateEn]);

  // Tiêu đề tiếng Anh đổi (tab English / nút Dịch) → đường dẫn tiếng Anh theo tiêu đề tiếng Anh
  useEffect(() => {
    if (!prev.current || titleEn === prev.current.en) return;
    prev.current = { ...prev.current, en: titleEn };
    const { saved, isNew, auto } = latest.current;
    if (!auto.en || !titleEn.trim()) return;
    clearTimeout(timer.current);
    req.current++;
    setTranslating(false);
    const back = !isNew && saved && same(titleEn, saved[field]?.en);
    patch({ slugEn: back ? saved.slugEn : slugify(titleEn) });
  }, [titleEn, field, patch]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Ô đường dẫn sửa tay → tắt tự động ô đó */
  const onChange = (v, lang) => {
    if (lang) {
      setAuto((a) => ({ ...a, [lang]: false }));
      if (lang === "en") {
        clearTimeout(timer.current);
        req.current++;
        setTranslating(false);
      }
    }
    patch({ slug: v.slug, slugEn: v.slugEn });
  };

  /** "Dùng lại tự động" → tính lại ngay theo tiêu đề hiện tại */
  const reAuto = (lang) => {
    setAuto((a) => ({ ...a, [lang]: true }));
    const back = !isNew && saved;
    if (lang === "vi")
      patch({ slug: back && same(titleVi, saved[field]?.vi) ? saved.slug : slugify(titleVi) });
    else if (back && same(titleVi, saved[field]?.vi) && same(titleEn, saved[field]?.en))
      patch({ slugEn: saved.slugEn });
    else if (titleEn.trim() && !same(titleEn, saved?.[field]?.en))
      patch({ slugEn: slugify(titleEn) });
    else translateEn(titleVi, 0);
  };

  return { auto, translating, onChange, reAuto };
}
