/**
 * Đường dẫn song ngữ: bản tiếng Việt dùng đường dẫn gốc ("/san-pham/mayqueen-slim"),
 * bản tiếng Anh dùng đoạn đường dẫn tiếng Anh ("/en/shop/mayqueen-slim"). Slug giữ nguyên.
 *
 * - Trong code LUÔN viết đường dẫn tiếng Việt và đi qua href(lang, path).
 * - Route thật nằm ở app/[lang]/<đoạn tiếng Việt>; next.config.mjs rewrite URL về route này.
 */
export const SEGMENTS_EN = {
  "san-pham": "shop",
  "song-dep": "journal",
  "thanh-toan": "checkout",
  "chinh-sach": "policies",
  "tra-cuu-don-hang": "track-order",
};

const SEGMENTS_VI = Object.fromEntries(Object.entries(SEGMENTS_EN).map(([vi, en]) => [en, vi]));

const mapFirstSegment = (path, table) => {
  const [p, hash] = path.split("#");
  const parts = p.split("/");
  if (parts[1]) parts[1] = table[parts[1]] ?? parts[1];
  return parts.join("/") + (hash !== undefined ? `#${hash}` : "");
};

export const toEnPath = (viPath) => mapFirstSegment(viPath, SEGMENTS_EN);
export const toViPath = (enPath) => mapFirstSegment(enPath, SEGMENTS_VI);
