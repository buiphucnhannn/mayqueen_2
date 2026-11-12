"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

/** Số dòng mỗi trang cho người dùng chọn (backend giới hạn tối đa 100) */
export const PAGE_SIZES = [10, 20, 50, 100];

const prefKey = (path) => `admin:page-size:${path}`;
function readPref(path) {
  try {
    const n = Number(localStorage.getItem(prefKey(path)));
    return PAGE_SIZES.includes(n) ? n : null;
  } catch {
    return null; // chế độ ẩn danh / chặn lưu trữ → dùng mặc định
  }
}
function writePref(path, n) {
  try {
    localStorage.setItem(prefKey(path), String(n));
  } catch {
    // không lưu được thì thôi — chỉ là tiện ích
  }
}

/** Trạng thái danh sách ↔ URL (?page=2&status=new&q=...) → F5 / Quay lại / gửi link vẫn đúng chỗ */
function readUrl() {
  const out = {};
  for (const [k, v] of new URLSearchParams(window.location.search)) if (v) out[k] = v;
  if (out.page) out.page = Math.max(1, Number.parseInt(out.page, 10) || 1);
  if (out.limit) out.limit = Number(out.limit);
  return out;
}
function writeUrl(params, defaultLimit) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === "" || v == null) continue;
    if (k === "page" && v === 1) continue; // giá trị mặc định → không ghi cho gọn link
    if (k === "limit" && v === defaultLimit) continue;
    qs.set(k, String(v));
  }
  const url = `${window.location.pathname}${qs.size ? `?${qs}` : ""}`;
  if (url !== `${window.location.pathname}${window.location.search}`)
    window.history.replaceState(window.history.state, "", url);
}

/**
 * Tải danh sách có phân trang / lọc / tìm kiếm cho các trang quản trị.
 *   const list = useAdminList("/orders");
 *   list.update({ status: "pending" })  → về trang 1 rồi tải lại
 *   list.setPage(3) / list.setLimit(50)
 *   list.setItems((items) => ...)        → cập nhật tại chỗ sau khi sửa 1 dòng
 *
 * - Trang, số dòng/trang, bộ lọc, từ khóa được giữ trên URL.
 * - Số dòng/trang người dùng chọn được nhớ riêng cho từng danh sách (localStorage).
 * - Trang hiện tại không còn dữ liệu (xóa dòng cuối, link cũ...) → tự lùi về trang cuối có dữ liệu.
 * - list.ready = false cho tới khi đọc xong URL (ô tìm kiếm dùng để hiện lại từ khóa cũ).
 */
export function useAdminList(path, { limit: defaultLimit = 20, initial = {} } = {}) {
  // null cho tới khi đọc URL ở trình duyệt (render phía server / lần đầu giống nhau → không lệch hydrate)
  const [params, setParams] = useState(null);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ items: [], meta: null, loading: true, error: null });
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Đọc URL + số dòng/trang đã nhớ (1 lần)
  useEffect(() => {
    const fromUrl = readUrl();
    const limit = PAGE_SIZES.includes(fromUrl.limit)
      ? fromUrl.limit
      : (readPref(path) ?? defaultLimit);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL chỉ đọc được ở trình duyệt, sau khi mount
    setParams({ page: 1, ...initial, ...fromUrl, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mở trang
  }, [path]);

  useEffect(() => {
    if (!params) return;
    writeUrl(params, defaultLimit);
    let alive = true;
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    api(`${path}?${qs}`)
      .then((r) => {
        if (!alive) return;
        const m = r.meta;
        // trang vượt quá số trang thực tế → lùi về trang cuối (tải lại ngay)
        if (m && m.total > 0 && m.page > m.totalPages) {
          setParams((p) => ({ ...p, page: m.totalPages }));
          return;
        }
        setState({ items: r.data, meta: m, loading: false, error: null });
      })
      .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      alive = false;
    };
  }, [path, params, defaultLimit, tick]);

  // Đổi bộ lọc → về trang 1. Không đổi gì (bấm lại tab đang chọn...) → không tải lại
  const update = useCallback((patch) => {
    const p = paramsRef.current;
    if (!p) return;
    const next = { ...p, page: 1, ...patch };
    if (Object.keys(next).every((k) => (next[k] ?? "") === (p[k] ?? ""))) return;
    paramsRef.current = next;
    setState((s) => ({ ...s, loading: true }));
    setParams(next);
  }, []);

  const setPage = useCallback((page) => {
    setState((s) => ({ ...s, loading: true }));
    setParams((p) => ({ ...p, page }));
    // về đầu trang để thấy dòng đầu của trang mới
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setLimit = useCallback(
    (limit) => {
      writePref(path, limit);
      update({ limit });
    },
    [path, update],
  );

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setTick((t) => t + 1);
  }, []);
  const setItems = useCallback((fn) => setState((s) => ({ ...s, items: fn(s.items) })), []);

  // đang lọc / tìm kiếm (ngoài trang & số dòng/trang) → bảng trống nghĩa là "không có kết quả phù hợp"
  const filtered =
    !!params &&
    Object.entries(params).some(([k, v]) => k !== "page" && k !== "limit" && v !== "" && v != null);

  return {
    ...state,
    filtered,
    ready: !!params,
    params: params ?? { page: 1, ...initial },
    update,
    setPage,
    setLimit,
    reload,
    setItems,
  };
}

/** Chữ cho bảng trống: đang lọc / tìm → "không tìm thấy", không lọc → emptyText ("Chưa có … nào.") */
export const emptyMessage = (list, emptyText) =>
  !list.loading && !list.items.length && (list.filtered ? NO_MATCH : emptyText);
export const NO_MATCH = "Không tìm thấy kết quả phù hợp";

/** Báo số việc cần xử lý (đơn chờ xác nhận, tư vấn mới) vừa đổi → thanh bên Admin tải lại số ngay */
export const TODO_EVENT = "admin:todo-changed";
export const notifyTodoChanged = () => window.dispatchEvent(new Event(TODO_EVENT));

/**
 * Số lượng theo trạng thái cho tab lọc: GET {path}/stats → { total, byStatus }.
 * Gọi reload sau khi đổi trạng thái / xóa → số trên tab lọc VÀ số cạnh menu bên trái cùng cập nhật.
 */
export function useStats(path) {
  const [stats, setStats] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api(`${path}/stats`)
      .then((r) => alive && setStats(r.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path, tick]);
  const reload = useCallback(() => {
    setTick((t) => t + 1);
    notifyTodoChanged();
  }, []);
  return [stats, reload];
}
