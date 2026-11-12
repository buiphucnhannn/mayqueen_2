/**
 * Gọi backend (be/) qua rewrite cùng origin /api/v1 → cookie đăng nhập HttpOnly tự gửi kèm.
 * - Luôn gửi header X-Requested-With: fetch (backend dùng để chống CSRF).
 * - 401 do hết phiên → tự làm mới token 1 lần rồi gửi lại; vẫn lỗi → về trang đăng nhập.
 *   api("/orders?limit=5")                       → { success, data, meta }
 *   api("/auth/login", { method: "POST", body })
 */
export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message || "Không kết nối được máy chủ");
    this.status = status;
    this.code = payload?.error?.code ?? (status === 0 ? "NETWORK_ERROR" : "ERROR");
    this.details = payload?.error?.details;
    this.retryAfter = payload?.error?.retryAfter;
  }
}

const SESSION_CODES = new Set(["TOKEN_EXPIRED", "UNAUTHENTICATED", "SESSION_EXPIRED"]);
const HEADERS = { Accept: "application/json", "X-Requested-With": "fetch" };

// Chỉ 1 request làm mới chạy cùng lúc (nhiều API cùng hết hạn → dùng chung 1 lần refresh)
let refreshing = null;
export const refreshSession = () =>
  (refreshing ??= fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    headers: HEADERS,
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => (refreshing = null)));

const UNSAVED_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Nội dung đang soạn VẪN CÒN ở tab này — hãy đăng nhập lại ở tab mới vừa mở, rồi quay lại đây bấm Lưu lần nữa.";

/** Đang ở khu quản trị → chuyển về trang đăng nhập (kèm đường dẫn để quay lại) */
export function redirectToLogin() {
  if (typeof window === "undefined" || !window.location.pathname.startsWith("/admin")) return false;
  // Form còn nội dung chưa lưu → giữ nguyên trang, mở đăng nhập ở tab mới (xem useFormGuard.js).
  // Trả false → api() báo lỗi bình thường (nút Lưu hết quay, hiện thông báo), không mất bài.
  if (window.__mqHasUnsaved?.()) {
    window.open("/login?next=%2Fadmin&het-phien=1", "_blank", "noopener");
    return false;
  }
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`/login?next=${next}&het-phien=1`);
  return true;
}

/**
 * timeout (ms, tuỳ chọn): quá thời gian → ApiError code "TIMEOUT" thay vì để nút "Đang gửi…" quay mãi
 * (mạng 4G chập chờn, máy chủ treo). Dùng cho thao tác của khách (đặt hàng, gửi tư vấn, tra cứu đơn).
 */
export async function api(path, { body, headers, retry = true, timeout, ...init } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await fetch(`/api/v1${path}`, {
      credentials: "same-origin",
      ...(timeout && { signal: AbortSignal.timeout(timeout) }),
      ...init,
      headers: {
        ...HEADERS,
        ...(body !== undefined && !isForm && { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined || isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === "TimeoutError")
      throw new ApiError(0, { error: { code: "TIMEOUT", message: "Máy chủ phản hồi quá lâu" } });
    throw new ApiError(0, null);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  const isAuthCall = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthCall && retry && SESSION_CODES.has(data?.error?.code)) {
    if (await refreshSession()) return api(path, { body, headers, retry: false, timeout, ...init });
    if (redirectToLogin()) return new Promise(() => {}); // đang chuyển trang → không báo lỗi thừa
    if (typeof window !== "undefined" && window.__mqHasUnsaved?.())
      throw new ApiError(401, { error: { code: "SESSION_EXPIRED", message: UNSAVED_MESSAGE } });
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
