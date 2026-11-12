import { NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/config/urls.mjs";
import { policies } from "@/data/policies";
import { href } from "@/i18n";
import { safeNext } from "@/lib/safe-next";
import { toViPath } from "@/i18n/routes.mjs";

/**
 * Proxy (Next 16 — thay cho middleware) bảo vệ khu quản trị TRƯỚC khi render:
 * hỏi backend /auth/me bằng cookie của trình duyệt (proxy không giữ secret JWT nào).
 * - Đã đăng nhập: vào /admin bình thường; vào /login → chuyển thẳng /admin.
 * - Access token hết hạn nhưng còn phiên → đi vòng qua /api/v1/auth/resume để làm mới rồi quay lại.
 * - Chưa đăng nhập → chuyển thẳng tới /login?next=<trang đang mở> (đăng nhập xong quay lại đúng trang).
 * - Bị giới hạn tần suất → trang 429.
 */
const HINT_COOKIES = ["mq_session", "__Host-mq_session"];

const hasSession = (request) => HINT_COOKIES.some((n) => request.cookies.has(n));

/**
 * IP THẬT của khách → giới hạn tần suất theo IP ở backend đúng người. CHỈ lấy từ nguồn khách không giả được:
 * - Hosting cPanel (LiteSpeed): LiteSpeed KHÔNG báo IP khách cho Node (luôn là 127.0.0.1) và chuyển nguyên
 *   X-Real-IP / X-Forwarded-For do khách tự gửi → không dùng được. .htaccess của website gắn IP thật vào
 *   header X-MQ-Client-IP (ghi đè giá trị khách tự gửi) — xem docs/HUONG-DAN-DEPLOY-HOSTING.md.
 * - Vercel: x-real-ip do Vercel tự đặt, khách không ghi đè được.
 * - Máy dev: phần tử cuối X-Forwarded-For.
 * Không xác định được → "" (backend tự tính theo kết nối: an toàn, không bị giả).
 * Gửi qua X-Client-IP — backend chỉ tin header này khi kèm đúng PROXY_SECRET (xem be proxy-guard).
 */
const isIp = (v) => /^[\d.]{7,15}$|^[\da-f:]{2,39}$/i.test(v ?? "");
function clientIp(request) {
  const h = (name) => request.headers.get(name)?.trim() ?? "";
  if (process.env.VERCEL) return h("x-real-ip");
  if (isIp(h("x-mq-client-ip"))) return h("x-mq-client-ip");
  if (process.env.NODE_ENV !== "production") return h("x-forwarded-for").split(",").pop().trim();
  return "";
}
function forwardedFor(request) {
  const ip = clientIp(request);
  return ip ? { "x-forwarded-for": ip, "x-client-ip": ip } : {};
}

async function currentUser(request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return { user: null };
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        cookie,
        accept: "application/json",
        ...forwardedFor(request),
        ...backendHeaders(),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 429)
      return { user: null, limited: true, retry: res.headers.get("retry-after") ?? "60" };
    if (!res.ok) return { user: null };
    return { user: (await res.json()).data.user };
  } catch {
    return { user: null };
  }
}

const PRIVATE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * Địa chỉ để proxy tự gọi lại chính site (lấy HTML trang 403 / 429 / 404).
 * Vercel, `next start`: request.url gọi lại được. Hosting cPanel (LiteSpeed nạp app qua socket nội bộ):
 * request.url là địa chỉ nội bộ KHÔNG gọi lại được → fetch lỗi → trang 404 trả nhầm mã 200 ("soft 404")
 * → dùng địa chỉ công khai NEXT_PUBLIC_SITE_URL.
 */
// SITE_ORIGIN (đặt lúc chạy, trong .env của từng site): cùng 1 bản build chạy cho 2 tên miền riêng
// (mayqueenslim.com / mayqueen.vn) → mỗi site tự gọi lại CHÍNH NÓ, site kia sập không ảnh hưởng.
const SELF_ORIGIN =
  !process.env.VERCEL && process.env.NODE_ENV === "production"
    ? process.env.SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || null
    : null;
const selfUrl = (path, request) => new URL(path, SELF_ORIGIN ?? request.url);

/**
 * Lấy HTML trang /403 hoặc /429 rồi trả kèm mã HTTP thật (URL trên trình duyệt không đổi).
 * Chuyển tiếp header `Link` (Next gắn preload font cho trang gốc): thiếu nó, trình duyệt chỉ biết tới
 * font khi đã parse CSS → chữ vẽ bằng font tạm rồi mới đổi sang font thật = "giật" lúc mở /admin chưa đăng nhập.
 */
async function statusPage(request, status, params) {
  const url = selfUrl(`/${status}`, request);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const page = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const headers = { "Content-Type": "text/html; charset=utf-8", ...PRIVATE };
    const link = page.headers.get("link");
    if (link) headers.Link = link;
    return new NextResponse(page.body, { status, headers });
  } catch {
    return NextResponse.rewrite(url);
  }
}

/**
 * Trang 404 riêng từng ngôn ngữ (toàn màn hình, html lang đúng, nút/logo trỏ đúng ngôn ngữ):
 * app/(nf-vi)/khong-tim-thay và app/(nf-en)/page-not-found.
 */
const NOT_FOUND_PAGES = { vi: "/khong-tim-thay", en: "/page-not-found" };
const INTERNAL_HEADER = "x-mq-404"; // proxy tự lấy trang 404 → đánh dấu để không lặp

/** Khu không thuộc site bán hàng (không kiểm tra đường dẫn site) */
const SYSTEM = new Set(["admin", "login", "403", "429", "opengraph-image"]);

/**
 * Các trang CÓ THẬT của site (đường dẫn tiếng Việt, sau khi bỏ /en, /vi và đổi đoạn tiếng Anh).
 * Đường dẫn khác → trang 404 đúng ngôn ngữ, mã 404 thật (xem notFoundPage).
 */
const SITE_ROUTES = [
  /^\/$/,
  /^\/(san-pham|song-dep|thanh-toan|tra-cuu-don-hang)$/,
  /^\/(san-pham|song-dep|chinh-sach)\/[^/]+$/,
];

/**
 * "/en/shop/x" → { lang: "en", path: "/san-pham/x", explicit: true }
 * "/san-pham/x" → { lang: "vi", explicit: true } (đoạn đường dẫn tiếng Việt)
 * "/abc" → { lang: "vi", explicit: false } (không rõ ngôn ngữ → trang 404 dùng ngôn ngữ khách đã chọn)
 */
const VI_SECTIONS = new Set([
  "san-pham",
  "song-dep",
  "thanh-toan",
  "chinh-sach",
  "tra-cuu-don-hang",
]);
function sitePath(pathname) {
  const m = pathname.match(/^\/(en|vi)(?=\/|$)/);
  const lang = m?.[1] ?? "vi";
  const rest = m ? pathname.slice(3) || "/" : pathname;
  const explicit = !!m || VI_SECTIONS.has(pathname.split("/")[1]);
  return {
    lang,
    explicit,
    path: (lang === "en" ? toViPath(rest) : rest).replace(/(.)\/$/, "$1"),
  };
}

/**
 * Ngôn ngữ cho trang 404 KHÔNG rõ ngôn ngữ (vd. /abc):
 * 1. ngôn ngữ khách đang dùng trên site (cookie mq_lang — components/common/RememberLang)
 * 2. khách mới: trình duyệt không khai báo tiếng Việt (khách nước ngoài) → tiếng Anh
 * 3. mặc định tiếng Việt
 */
const LANG_COOKIE = "mq_lang";
function preferredLang(request) {
  const saved = request.cookies.get(LANG_COOKIE)?.value;
  if (saved === "vi" || saved === "en") return saved;
  const accept = (request.headers.get("accept-language") || "").toLowerCase();
  if (accept && !/(^|[,\s])vi\b/.test(accept) && /(^|[,\s])en\b/.test(accept)) return "en";
  return "vi";
}

/**
 * Trang 404 của site, URL trên trình duyệt giữ nguyên:
 * lấy HTML trang 404 ĐÚNG NGÔN NGỮ (NOT_FOUND_PAGES) rồi trả kèm mã HTTP 404 THẬT.
 * (Không dùng rewrite: trang 404 được dựng tĩnh nên Next trả mã 200 → Google coi là "soft 404".)
 */
async function notFoundPage(request, lang) {
  const url = selfUrl(NOT_FOUND_PAGES[lang] ?? NOT_FOUND_PAGES.vi, request);
  try {
    const page = await fetch(url, {
      cache: "no-store",
      headers: { [INTERNAL_HEADER]: "1" },
      signal: AbortSignal.timeout(8000),
    });
    const headers = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    };
    const link = page.headers.get("link"); // preload font (xem statusPage)
    if (link) headers.Link = link;
    return new NextResponse(page.body, { status: 404, headers });
  } catch {
    return NextResponse.rewrite(url, { status: 404 });
  }
}

// Slug hợp lệ của từng mục — slug lạ → 404 thật (trang chi tiết stream nên notFound() bên trong chỉ trả mã 200).
// Sản phẩm / bài viết quản lý trong Admin → lấy danh sách (chỉ mục ĐANG BÁN / ĐÃ ĐĂNG) từ backend.
// Nhớ NGẮN vì bộ nhớ proxy nằm rải trên nhiều máy chủ Vercel — nút Lưu ở Admin không xóa được nó:
// - slug đã biết: dùng lại tối đa 5s → admin ẩn / xóa / đổi đường dẫn thì vài giây sau trang theo ngay
//   (nhớ lâu → trang vừa ẩn vẫn lọt vào, render trang trống mã 200; trang vừa bật vẫn bị báo 404)
// - slug lạ: hỏi lại backend nếu danh sách cũ hơn 1s → sản phẩm vừa bật bán / bài vừa đăng hiện ngay
// Nhiều request cùng lúc chỉ gọi backend 1 lần (dùng chung promise). Backend lỗi → cho qua (trang tự xử lý).
const POLICY_PAIRS = policies.map((p) => ({ vi: p.urlSlug.vi, en: p.urlSlug.en, old: [] }));
const SECTIONS = ["san-pham", "song-dep", "chinh-sach"];
const SLUG_TTL = 5_000;
const SLUG_TTL_MISS = 1_000;
let slugCache = { at: 0, data: null };
let slugLoading = null;

async function fetchSlugs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/slugs`, {
      headers: backendHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const { products, articles } = (await res.json()).data; // [{ vi, en, old: [slug cũ] }]
    slugCache = { at: Date.now(), data: { "san-pham": products, "song-dep": articles } };
  } catch {
    slugCache.at = Date.now(); // tránh dồn request khi backend đang lỗi (giữ danh sách cũ nếu có)
  } finally {
    slugLoading = null;
  }
  return slugCache.data;
}

function loadSlugs(force = false) {
  const age = Date.now() - slugCache.at;
  if (slugCache.data && age < (force ? SLUG_TTL_MISS : SLUG_TTL)) return slugCache.data;
  return (slugLoading ??= fetchSlugs());
}

/**
 * Cặp đường dẫn { vi, en } chứa slug này — null: không tồn tại; undefined: backend lỗi (cho qua).
 * Mỗi mục có slug riêng từng ngôn ngữ; `old` = slug cũ (Admin đã đổi đường dẫn) → chuyển hướng 308 sang
 * slug hiện tại thay vì 404 (giữ thứ hạng Google + link đã chia sẻ).
 */
const hit = (p, slug) => p.vi === slug || p.en === slug || p.old?.includes(slug);

async function findSlug(section, slug) {
  if (section === "chinh-sach") return POLICY_PAIRS.find((p) => hit(p, slug)) ?? null;
  const match = (list) => list[section].find((p) => hit(p, slug)) ?? null;
  const known = await loadSlugs();
  if (!known) return undefined;
  return match(known) ?? ((known2) => (known2 ? match(known2) : undefined))(await loadSlugs(true));
}

/** /en/shop/x → ["san-pham","x","en"] - /san-pham/x → ["san-pham","x","vi"] */
function detailSlug(pathname) {
  const lang = pathname.startsWith("/en/") ? "en" : "vi";
  const vi = lang === "en" ? toViPath(pathname.slice(3)) : pathname;
  const [, section, slug, extra] = vi.split("/");
  return SECTIONS.includes(section) && slug && !extra ? [section, slug, lang] : null;
}

/**
 * API trình duyệt gọi (/api/v1/*) → chuyển tiếp sang backend KÈM mã bí mật (PROXY_SECRET).
 * Backend chỉ nhận request có mã này → không ai gọi thẳng *.onrender.com để giả IP né giới hạn.
 * Chưa đặt PROXY_SECRET (máy dev) → cho qua, rewrites trong next.config.mjs chuyển tiếp như cũ.
 */
function forwardApi(request) {
  const secret = backendHeaders();
  if (!Object.keys(secret).length) return NextResponse.next();
  const { pathname, search, host, protocol } = request.nextUrl;
  const headers = new Headers(request.headers);
  for (const [k, v] of Object.entries(secret)) headers.set(k, v);
  // giữ thông tin gốc của khách: IP thật (giới hạn tần suất), tên miền (chống CSRF ở backend).
  // Xóa mọi header IP khách tự gửi rồi đặt lại bằng IP thật (nếu xác định được) → không giả được.
  for (const k of ["x-client-ip", "x-forwarded-for", "x-real-ip", "x-mq-client-ip"])
    headers.delete(k);
  for (const [k, v] of Object.entries(forwardedFor(request))) headers.set(k, v);
  headers.set("x-forwarded-host", request.headers.get("x-forwarded-host") || host);
  headers.set(
    "x-forwarded-proto",
    request.headers.get("x-forwarded-proto") || protocol.replace(":", ""),
  );
  return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL), { request: { headers } });
}

export async function proxy(request) {
  const { pathname, search, searchParams } = request.nextUrl;
  if (pathname.startsWith("/api/v1/")) return forwardApi(request);

  const first = pathname.split("/")[1] ?? "";
  // trang 404 riêng: proxy tự lấy → cho qua; người dùng gõ thẳng → cũng trả về như trang 404 (mã 404)
  const nfLang = Object.keys(NOT_FOUND_PAGES).find((l) => NOT_FOUND_PAGES[l] === pathname);
  if (nfLang) {
    if (request.headers.get(INTERNAL_HEADER)) return NextResponse.next();
    return notFoundPage(request, nfLang);
  }
  if (!SYSTEM.has(first)) {
    // đường dẫn không thuộc trang nào của site (vd. /abc, /en/abc, /en/shop/x/y) → 404 đúng ngôn ngữ
    const site = sitePath(pathname);
    if (!SITE_ROUTES.some((r) => r.test(site.path)))
      return notFoundPage(request, site.explicit ? site.lang : preferredLang(request));
    // Cùng 1 trang chỉ có 1 địa chỉ (SEO, tránh nội dung trùng lặp): /vi/… → /…, /en/san-pham/x → /en/shop/x
    // (đoạn đường dẫn tiếng Việt dưới /en). Chuyển vĩnh viễn 308, giữ query string.
    const canonical = href(site.lang, site.path);
    if (canonical !== pathname) {
      const res = NextResponse.redirect(new URL(canonical + search, request.url), 308);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }
  const detail = detailSlug(pathname);
  if (detail) {
    const [section, slug, lang] = detail;
    const pair = await findSlug(section, slug);
    // slug không tồn tại → trang 404 (mã 404 thật) đúng ngôn ngữ đang xem
    if (pair === null) return notFoundPage(request, lang);
    // Slug của ngôn ngữ kia (vd. bấm đổi VI ↔ EN) hoặc slug cũ → chuyển (vĩnh viễn) sang đường dẫn hiện tại
    if (pair && pair[lang] !== slug) {
      const res = NextResponse.redirect(
        new URL(href(lang, `/${section}/${pair[lang]}`) + search, request.url),
        308,
      );
      // Google vẫn hiểu là chuyển vĩnh viễn, nhưng trình duyệt KHÔNG nhớ mãi: Admin đổi slug qua lại / xoá rồi
      // tạo sản phẩm mới trùng slug cũ thì khách không bị kẹt vòng chuyển hướng hoặc trang 404
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }
  if (first !== "admin" && first !== "login") return NextResponse.next();

  const { user, limited, retry } = await currentUser(request);

  if (pathname === "/login") {
    // đã đăng nhập → về đúng trang ?next (chỉ đường dẫn nội bộ /admin…), không có thì /admin
    if (user)
      return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), request.url));
    const res = NextResponse.next();
    Object.entries(PRIVATE).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (limited) return statusPage(request, 429, { next: pathname + search, retry });

  if (user) {
    // vừa làm mới phiên xong → bỏ tham số đánh dấu khỏi URL cho gọn
    if (searchParams.has("resumed")) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("resumed");
      return NextResponse.redirect(clean);
    }
    const res = NextResponse.next();
    Object.entries(PRIVATE).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Hết access token nhưng còn phiên → làm mới qua backend (refresh cookie chỉ gửi tới /api/v1/auth)
  if (hasSession(request) && searchParams.get("resumed") !== "1") {
    const back = request.nextUrl.clone();
    back.searchParams.set("resumed", "1"); // chống vòng lặp chuyển hướng
    const resume = new URL("/api/v1/auth/resume", request.url);
    resume.searchParams.set("next", back.pathname + back.search);
    return NextResponse.redirect(resume);
  }

  // Chưa đăng nhập → thẳng tới trang đăng nhập; xong quay lại đúng trang đang mở
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  const res = NextResponse.redirect(login, 307);
  Object.entries(PRIVATE).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

// Chạy cho mọi trang (bỏ qua tài nguyên tĩnh, ảnh, file có đuôi .xxx) + API /api/v1/* (gắn mã bí mật)
export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)", "/api/v1/:path*"],
};
