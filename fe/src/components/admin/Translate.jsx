"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { api } from "@/lib/api";
import { Button, useConfirm, useToast } from "./ui";

/** Chuỗi song ngữ trong form: object đúng 2 khóa { vi, en } */
const isLoc = (v) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).length === 2 &&
  "vi" in v &&
  "en" in v;

/** Mọi chuỗi song ngữ trong form (duyệt sâu) → [{ path, value }] */
function collect(node, path = [], out = []) {
  if (isLoc(node)) out.push({ path, value: node });
  else if (Array.isArray(node)) node.forEach((x, i) => collect(x, [...path, i], out));
  else if (node && typeof node === "object")
    Object.entries(node).forEach(([k, x]) => collect(x, [...path, k], out));
  return out;
}

function setIn(obj, [key, ...rest], value) {
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[key] = rest.length ? setIn(obj[key], rest, value) : value;
  return copy;
}

/** Thống kê để quyết định dịch gì: ô tiếng Việt có chữ, ô tiếng Anh còn trống / đã có */
export function translateStats(form) {
  const all = collect(form).filter((x) => x.value.vi.trim());
  return {
    empty: all.filter((x) => !x.value.en.trim()).length,
    filled: all.filter((x) => x.value.en.trim()).length,
  };
}

const isHtml = (s) => /^\s*<[a-z]/i.test(s);

/** HTML (nội dung bài viết) → các đoạn chữ cần dịch; thẻ, liên kết, ảnh, bảng giữ nguyên */
function htmlTextNodes(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  return { doc, nodes };
}

/** Gọi API dịch theo từng lô (backend nhận tối đa 300 chuỗi / lần) */
async function translateTexts(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 250) {
    const res = await api("/translate", {
      method: "POST",
      body: { texts: texts.slice(i, i + 250), from: "vi", to: "en" },
    });
    out.push(...res.data);
  }
  return out;
}

/** Dịch các ô tiếng Việt sang tiếng Anh. overwrite=false: chỉ điền ô tiếng Anh còn trống */
export async function translateForm(form, { overwrite = false } = {}) {
  const targets = collect(form).filter(
    (x) => x.value.vi.trim() && (overwrite || !x.value.en.trim()),
  );
  if (!targets.length) return { next: form, count: 0 };

  // Gom mọi đoạn chữ (ô thường: cả chuỗi; nội dung HTML: từng đoạn chữ bên trong) → 1 lượt dịch
  const jobs = targets.map((x) =>
    isHtml(x.value.vi) ? { ...x, html: htmlTextNodes(x.value.vi) } : x,
  );
  const texts = jobs.flatMap((j) =>
    j.html ? j.html.nodes.map((n) => n.nodeValue.trim()) : [j.value.vi],
  );
  const translated = await translateTexts(texts);

  let next = form;
  let k = 0;
  for (const j of jobs) {
    let en;
    if (j.html) {
      for (const node of j.html.nodes) {
        const t = translated[k++];
        // giữ khoảng trắng đầu / cuối (chữ nằm giữa các thẻ in đậm, liên kết...)
        if (t) {
          const [, lead, trail] = node.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);
          node.nodeValue = lead + t + trail;
        }
      }
      en = j.html.doc.body.innerHTML;
    } else en = translated[k++];
    if (en) next = setIn(next, j.path, { ...j.value, en });
  }
  return { next, count: targets.length };
}

/**
 * Nút "Dịch sang tiếng Anh" (đặt cạnh nút chọn ngôn ngữ ở đầu form):
 * điền bản dịch vào các ô tiếng Anh còn trống; nếu mọi ô đã có thì hỏi có dịch lại (ghi đè) không.
 */
export function TranslateButton({ form, setForm, onDone }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const run = async () => {
    const { empty, filled } = translateStats(form);
    if (!empty && !filled) return toast("Chưa có nội dung tiếng Việt để dịch", "error");
    let overwrite = false;
    if (!empty) {
      overwrite = await confirm({
        title: "Dịch lại toàn bộ?",
        message: `Mọi phần tiếng Anh đã có nội dung (${filled} phần). Dịch lại sẽ ghi đè bản tiếng Anh hiện tại.`,
        confirmLabel: "Dịch lại & ghi đè",
      });
      if (!overwrite) return;
    }
    setBusy(true);
    try {
      const { next, count } = await translateForm(form, { overwrite });
      setForm(next);
      toast(`Đã dịch ${count} phần sang tiếng Anh — kiểm tra lại trước khi lưu`);
      onDone?.();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={run} loading={busy}>
      {!busy && <Languages className="size-4" aria-hidden="true" />} Dịch tự động
    </Button>
  );
}
