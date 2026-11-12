import sanitizeHtml from "sanitize-html";

/**
 * Lọc HTML nội dung bài viết (trình soạn thảo trong Admin) trước khi lưu — chống XSS.
 * Chỉ giữ đúng những gì trình soạn thảo tạo ra: tiêu đề, đoạn văn, định dạng chữ, danh sách,
 * trích dẫn, liên kết, bảng, ảnh (chỉ ảnh Cloudinary), màu chữ / nền, căn lề, giãn dòng.
 */
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i];
const ALIGN = [/^(left|right|center|justify)$/];
// giãn dòng: số 1 – 3 (VD 1.15, 2) — đúng các mức trong trình soạn thảo
const LINE_HEIGHT = [/^[1-3](\.\d{1,2})?$/];

const OPTIONS = {
  allowedTags: [
    "h2",
    "h3",
    "h4",
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "mark",
    "span",
    "sub",
    "sup",
    "code",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "colgroup",
    "col",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan", "colwidth"],
    td: ["colspan", "rowspan", "colwidth"],
    col: ["style"],
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      color: COLOR,
      "background-color": COLOR,
      "text-align": ALIGN,
      "line-height": LINE_HEIGHT,
    },
    col: { width: [/^\d+px$/] },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https"] },
  // ảnh: chỉ nhận ảnh đã upload lên Cloudinary (tránh ảnh ngoài / theo dõi người đọc)
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !/^https:\/\/res\.cloudinary\.com\//.test(frame.attribs.src ?? ""),
  // link ra ngoài: mở tab mới, không lộ trang nguồn
  transformTags: {
    a: (tag, attribs) => ({
      tagName: "a",
      attribs: /^https?:/.test(attribs.href ?? "")
        ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
        : { href: attribs.href },
    }),
  },
};

export const sanitizeRichText = (html = "") => sanitizeHtml(html, OPTIONS).trim();

/** "<p></p>" / chỉ khoảng trắng → coi như trống */
export const isEmptyRichText = (html = "") =>
  !html
    .replace(/<(?!img)[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim() && !/<img/i.test(html);

/** HTML → chữ thuần (đếm từ, tìm kiếm...) */
export const richTextToPlain = (html = "") =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
