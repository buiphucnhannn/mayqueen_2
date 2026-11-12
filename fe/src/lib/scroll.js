/**
 * Nhịp cuộn dùng chung cho mọi hiệu ứng theo cuộn (Parallax, ScrollWords, Header, BackToTop).
 *
 * Vì sao không dùng window "scroll" + requestAnimationFrame riêng trong từng component?
 * Lenis đặt vị trí cuộn BÊN TRONG requestAnimationFrame của nó; sự kiện "scroll" của trình duyệt
 * chỉ tới ở frame sau → hiệu ứng luôn trễ 1 nhịp so với trang → rung, giật.
 * Ở đây SmoothScroll gọi emitScroll() ngay trong sự kiện "scroll" của Lenis (cùng frame),
 * nên mọi hiệu ứng cập nhật đồng bộ với khung hình đang vẽ.
 *
 * - subscribeScroll(onScroll, onMeasure): onScroll(y) chạy mỗi khi vị trí cuộn đổi — CHỈ ghi style,
 *   không đọc layout. onMeasure() chạy lúc đầu và khi trang đổi kích thước — nơi đọc layout (đo 1 lần).
 */
const scrollSubs = new Set();
const measureSubs = new Set();
let attached = false;
let lastY = 0;

export function emitScroll(y) {
  lastY = y;
  scrollSubs.forEach((fn) => fn(y));
}

function remeasure() {
  measureSubs.forEach((fn) => fn());
  emitScroll(window.scrollY);
}

function attach() {
  if (attached) return;
  attached = true;
  // Dự phòng khi Lenis chưa/không chạy: nghe scroll gốc của trình duyệt
  window.addEventListener("scroll", () => !window.__lenis && emitScroll(window.scrollY), {
    passive: true,
  });
  // Ảnh/font tải xong làm trang đổi chiều cao → đo lại (gộp nhiều lần thay đổi thành 1)
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(remeasure, 120);
  };
  window.addEventListener("resize", schedule);
  new ResizeObserver(schedule).observe(document.body);
}

export function subscribeScroll(onScroll, onMeasure) {
  attach();
  if (onMeasure) {
    measureSubs.add(onMeasure);
    onMeasure();
  }
  scrollSubs.add(onScroll);
  onScroll(lastY || window.scrollY);
  return () => {
    scrollSubs.delete(onScroll);
    if (onMeasure) measureSubs.delete(onMeasure);
  };
}

// Vị trí mép trên của phần tử trong tài liệu, KHÔNG tính transform (offsetTop bỏ qua transform)
export function documentTop(el) {
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  return y;
}

// Khóa / mở cuộn trang khi mở giỏ hàng, menu mobile
export function lockScroll(locked) {
  if (locked) window.__lenis?.stop();
  else window.__lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
