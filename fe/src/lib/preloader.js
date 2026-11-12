/**
 * Bỏ qua màn chào (components/fx/Preloader.jsx) khi đi từ khu Admin về trang chủ:
 * Admin đặt cờ sessionStorage → script chạy ở <head> trang bán hàng gắn data-skip-preloader lên <html>
 * trước khi vẽ (CSS ẩn ngay, không chớp) rồi xóa cờ.
 */
export const SKIP_PRELOADER_KEY = "mq-skip-preloader";

// Màn chào chỉ dành cho lần VÀO WEB từ bên ngoài (Google, Facebook, gõ địa chỉ…). Đi từ chính site sang mà trình
// duyệt tải lại cả trang — mở link chính sách ở tab mới (ô tick đồng ý), bấm VI / EN… — thì trang giới thiệu
// (document.referrer) cùng tên miền → bỏ qua màn chào, khách đang dùng web không phải xem lại.
export const skipPreloaderScript = `try{var d=document.documentElement,r=document.referrer;if(sessionStorage.getItem("${SKIP_PRELOADER_KEY}")){sessionStorage.removeItem("${SKIP_PRELOADER_KEY}");d.dataset.skipPreloader="1"}else if(r&&new URL(r).origin===location.origin){d.dataset.skipPreloader="1"}}catch(e){}`;

/**
 * Tín hiệu "màn chào đã xong" → video đầu trang chỉ bắt đầu phát lúc này (trước đây video chạy ngầm phía sau
 * màn chào → khách mất đoạn đầu). Màn chào bị bỏ qua / không có → báo xong ngay.
 */
const INTRO_DONE_EVENT = "mq:intro-done";

export function markIntroDone() {
  if (typeof window === "undefined" || window.__mqIntroDone) return;
  window.__mqIntroDone = true;
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

/** Gọi cb khi màn chào xong (đã xong rồi → gọi ngay). Trả hàm huỷ đăng ký. */
export function onIntroDone(cb) {
  if (window.__mqIntroDone) {
    cb();
    return () => {};
  }
  window.addEventListener(INTRO_DONE_EVENT, cb, { once: true });
  return () => window.removeEventListener(INTRO_DONE_EVENT, cb);
}

/** Gọi trước khi rời Admin sang trang bán hàng */
export function skipNextPreloader() {
  try {
    sessionStorage.setItem(SKIP_PRELOADER_KEY, "1");
  } catch {
    // trình duyệt chặn storage → vẫn hiện màn chào, không sao
  }
}
