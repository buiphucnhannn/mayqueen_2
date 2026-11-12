import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Dịch tự động cho Admin (nút "Dịch sang tiếng Anh").
 * Dùng endpoint công khai của Google Translate (client=gtx): miễn phí, không cần API key, không giới hạn
 * cố định. Đây là endpoint không chính thức — nếu Google chặn tạm thời, Admin nhận thông báo và nhập tay.
 * Gọi qua backend (không gọi thẳng từ trình duyệt): tránh CORS, có bộ nhớ đệm, giới hạn tần suất.
 */
const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const MAX_CHUNK = 1500; // ký tự / lần gọi (URL GET có giới hạn độ dài)
const CONCURRENCY = 3; // gọi song song vừa phải → Google ít chặn tạm thời hơn
const cache = new Map(); // `${from}>${to}:${text}` → bản dịch (giữ tối đa 2000 mục)

/** Chia văn bản dài theo câu để mỗi lần gọi ≤ MAX_CHUNK ký tự */
function chunks(text) {
  if (text.length <= MAX_CHUNK) return [text];
  const out = [];
  let cur = "";
  for (const part of text.split(/(?<=[.!?…\n])\s+/)) {
    if ((cur + " " + part).length > MAX_CHUNK && cur) {
      out.push(cur);
      cur = part;
    } else cur = cur ? `${cur} ${part}` : part;
  }
  if (cur) out.push(cur);
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY_DELAYS = [400, 1200]; // lỗi tạm thời → thử lại 2 lần (tổng 3 lần), chờ tăng dần

/**
 * Gọi Google 1 đoạn. Endpoint công khai thỉnh thoảng trả 429 / 5xx hoặc rớt mạng khi gọi dồn
 * (form nhiều ô) → thử lại có chờ + lệch ngẫu nhiên, thay vì làm hỏng cả lượt dịch vì 1 đoạn lỗi.
 */
async function callGoogle(text, from, to) {
  const url = `${ENDPOINT}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.status === 429 || res.status >= 500)
        throw Object.assign(new Error(`Google Translate HTTP ${res.status}`), { retry: true });
      if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
      const data = await res.json();
      return data[0].map((seg) => seg[0]).join("");
    } catch (err) {
      const transient = err.retry || err.name === "TimeoutError" || err.name === "TypeError";
      if (!transient || attempt >= RETRY_DELAYS.length) throw err;
      await sleep(RETRY_DELAYS[attempt] + Math.random() * 300);
    }
  }
}

async function translateOne(text, from, to) {
  const key = `${from}>${to}:${text}`;
  if (cache.has(key)) return cache.get(key);
  const parts = [];
  for (const c of chunks(text)) parts.push(await callGoogle(c, from, to));
  const out = parts.join(" ");
  if (cache.size >= 2000) cache.delete(cache.keys().next().value);
  cache.set(key, out);
  return out;
}

export const translateService = {
  /** texts[] → bản dịch[] (cùng thứ tự; chuỗi rỗng giữ rỗng) */
  async translate(texts, from = "vi", to = "en") {
    const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
    const result = new Map();
    try {
      for (let i = 0; i < unique.length; i += CONCURRENCY) {
        const batch = unique.slice(i, i + CONCURRENCY);
        const done = await Promise.all(batch.map((t) => translateOne(t, from, to)));
        batch.forEach((t, j) => result.set(t, done[j]));
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Dịch tự động thất bại");
      throw ApiError.unavailable(
        "Dịch tự động đang tạm gián đoạn, vui lòng thử lại sau ít phút hoặc nhập tay",
        "TRANSLATE_UNAVAILABLE",
      );
    }
    return texts.map((t) => result.get(t.trim()) ?? "");
  },
};
