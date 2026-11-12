/**
 * Đường dẫn quay lại sau đăng nhập (?next=). Chỉ chấp nhận đường dẫn nội bộ trong /admin
 * → chặn open redirect (//evil.com, \evil.com, https://...).
 */
export function safeNext(raw, fallback = "/admin") {
  const next = String(raw ?? "");
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return fallback;
  try {
    const url = new URL(next, "http://x");
    url.searchParams.delete("resumed");
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
