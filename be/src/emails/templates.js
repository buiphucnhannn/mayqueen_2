import { isComboNote, packSummary, packText } from "../utils/pack.js";
/**
 * Mẫu email thông báo cho admin — đơn hàng mới & yêu cầu tư vấn mới.
 *
 * Viết theo chuẩn email (không phải web): bố cục bằng <table>, style inline, font hệ thống có sẵn, rộng tối đa
 * 600px → hiển thị đúng trên Gmail (web / app), Outlook, Apple Mail. Màu theo bộ nhận diện website
 * (xanh rêu forest, sage, nền kem pearl / linen).
 * MỌI nội dung khách nhập đều được escape → không chèn được HTML / link lạ vào email.
 * Mỗi mẫu trả { subject, html, text } — text là bản thuần chữ cho ứng dụng không hiện HTML.
 */

const C = {
  forest: "#1e3a28",
  forestDeep: "#142a1c",
  sage: "#5f7d41",
  sageSoft: "#b3ca93",
  sage50: "#f4f7ee",
  pearl: "#fffdf8",
  linen: "#f4f1ea",
  line: "#e6dfd1",
  ink: "#1c2a21",
  inkSoft: "#4b5a50",
  muted: "#7b877e",
  amber: "#9a6b12",
  amberBg: "#fbf1dc",
};
// Font có chân HỖ TRỢ ĐỦ tiếng Việt (Georgia thiếu chữ có dấu chồng như "ầ, ấ" → hiện "câ`u").
// Palatino / Book Antiqua / Cambria / Times New Roman đều có sẵn trên Windows, macOS, iOS, Android.
const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', Cambria, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
// SỐ (mã đơn, tiền, SĐT): font không chân hệ thống + chữ số thẳng hàng, đều độ rộng → "0" không lẫn "o",
// số tiền dễ so; font có chân chỉ dùng cho CHỮ tiêu đề.
const NUM = `font-family:${SANS};font-variant-numeric:lining-nums tabular-nums;font-feature-settings:'lnum' 1,'tnum' 1;`;

/** Escape nội dung người dùng nhập trước khi đưa vào HTML */
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const vnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;
const when = (d) =>
  new Date(d ?? Date.now()).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
// "0912345678" → "0912 345 678" (dễ đọc khi gọi lại)
const prettyPhone = (p = "") => String(p).replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

const LOGO_PATH = "/images/brand/logo-bot-horizontal-white.png";

/** Khung chung: dải đầu xanh rêu + logo, thẻ nội dung, chân trang */
function layout({ siteUrl, preheader, eyebrow, body }) {
  // Logo = ảnh PNG ~10KB lấy từ chính website (siteUrl luôn là link https công khai — xem env.mail.siteUrl),
  // tải qua link, KHÔNG đính kèm. Gmail tự hiện ảnh với thư trong Hộp thư đến; thư bị xếp vào Spam thì Gmail
  // chặn mọi ảnh → khi đó hiện chữ alt trắng trên nền xanh (không vỡ khung).
  const logo = `<img src="${esc(siteUrl)}${LOGO_PATH}" width="120" height="46" alt="BOT VIỆT NAM" style="display:block;width:120px;height:46px;border:0;outline:none;text-decoration:none;font-family:${SANS};font-size:15px;font-weight:800;letter-spacing:2px;line-height:46px;color:${C.pearl};">`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(preheader)}</title>
</head>
<body style="margin:0;padding:0;background:${C.linen};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.linen};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <tr><td style="background:${C.forest};border-radius:18px 18px 0 0;padding:22px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;">${logo}</td>
          <td align="right" style="vertical-align:middle;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.sageSoft};">${esc(eyebrow)}</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:${C.pearl};border-radius:0 0 18px 18px;padding:30px 28px 32px;border:1px solid ${C.line};border-top:0;">
        ${body}
      </td></tr>
      <tr><td align="center" style="padding:18px 8px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">
        Thông báo tự động từ website Mayqueen Slim gửi tới quản trị viên.<br>
        Chính hãng B.O.T Việt Nam${siteUrl ? ` · <a href="${esc(siteUrl)}" style="color:${C.sage};text-decoration:none;">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a>` : ""}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const h1 = (text) =>
  `<h1 style="margin:0;text-align:center;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:400;color:${C.forest};">${text}</h1>`;
const pill = (text, fg, bg) =>
  `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${bg};color:${fg};font-family:${SANS};font-size:12px;font-weight:700;">${esc(text)}</span>`;
const sectionTitle = (text) =>
  `<p style="margin:26px 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.sage};">${esc(text)}</p>`;
const row = (label, valueHtml) =>
  `<tr>
    <td style="padding:7px 0;width:118px;vertical-align:top;font-family:${SANS};font-size:13px;color:${C.muted};">${esc(label)}</td>
    <td style="padding:7px 0;vertical-align:top;font-family:${SANS};font-size:14px;line-height:1.5;color:${C.ink};">${valueHtml}</td>
  </tr>`;
const phoneLink = (phone) =>
  `<a href="tel:${esc(phone)}" style="${NUM}color:${C.forest};font-weight:700;text-decoration:none;">${esc(prettyPhone(phone))}</a>
   <a href="tel:${esc(phone)}" style="margin-left:8px;display:inline-block;padding:3px 10px;border-radius:999px;background:${C.sage50};color:${C.sage};font-size:12px;font-weight:700;text-decoration:none;">Gọi ngay</a>`;
const button = (href, text) =>
  `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;"><tr>
    <td style="border-radius:999px;background:${C.forest};">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.pearl};text-decoration:none;border-radius:999px;">${esc(text)} &rarr;</a>
    </td></tr></table>`;
// Khách đặt / gửi form từ trang tiếng Anh → nhắc admin tư vấn bằng tiếng Anh
const EN_PILL = pill("English — khách xem trang tiếng Anh", C.amber, C.amberBg);
const EN_TEXT = "Ngôn ngữ: English (khách xem trang tiếng Anh)";
const noteBox = (note) =>
  `<div style="margin-top:6px;padding:14px 16px;border-radius:12px;background:${C.sage50};border-left:3px solid ${C.sage};font-family:${SANS};font-size:14px;line-height:1.6;color:${C.inkSoft};white-space:pre-line;">${esc(note)}</div>`;

/** Email "Đơn hàng mới" */
export function orderEmail(order, { siteUrl = "", units = {} } = {}) {
  const c = order.customer ?? {};
  // "Tổng cần chuẩn bị cho đơn này" — giống ngăn chi tiết đơn trong Admin (OrdersPage.jsx), đặt ngay dưới danh sách
  // sản phẩm, TRƯỚC Tạm tính / Phí vận chuyển / Tổng cộng: gộp combo + hàng lẻ
  // thành tổng từng sản phẩm; chỉ hiện khi đơn có combo hoặc từ 2 dòng (đơn 1 món lẻ thì dòng "Cần chuẩn bị" đã đủ)
  const summary =
    (order.lines.length > 1 || order.lines.some((l) => isComboNote(l.optionNote))) &&
    packSummary(order.lines, units);
  const summaryHtml = summary?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;background:${C.sage50};border:1px solid ${C.sageSoft};border-radius:12px;">
        <tr><td style="padding:14px 16px 6px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.forest};">Tổng cần chuẩn bị cho đơn này</td></tr>
        ${summary
          .map(
            (s) => `<tr><td style="padding:0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding:5px 0;font-family:${SANS};font-size:14px;color:${C.ink};">${esc(s.name)}</td>
                <td align="right" style="padding:5px 0;${NUM}font-size:16px;font-weight:700;color:${C.forest};white-space:nowrap;">${s.count} ${esc(s.unit)}</td>
              </tr></table>
            </td></tr>`,
          )
          .join("")}
        <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
      </table>`
    : "";
  const transfer = order.paymentMethod === "bank_transfer";
  const payLabel = transfer ? "Chuyển khoản ngân hàng (VietQR)" : "Thanh toán khi nhận hàng (COD)";
  const adminLink = siteUrl ? `${siteUrl}/admin/don-hang?q=${encodeURIComponent(order.code)}` : "";
  const items = order.lines
    .map(
      (l) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:1.45;color:${C.ink};">
          <strong style="font-weight:600;">${esc(l.name)}</strong>
          ${l.optionLabel ? `<br><span style="font-size:12.5px;color:${C.muted};">${esc(l.optionLabel)}</span>` : ""}
          <br><span style="font-size:12.5px;color:${C.inkSoft};">Cần chuẩn bị: <strong style="font-weight:600;color:${C.ink};">${esc(packText(l))}</strong></span>
        </td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid ${C.line};${NUM}font-size:13px;color:${C.inkSoft};white-space:nowrap;">${l.qty} × ${vnd(l.price)}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};${NUM}font-size:14px;font-weight:600;color:${C.ink};white-space:nowrap;">${vnd(l.lineTotal)}</td>
      </tr>`,
    )
    .join("");
  const money = (label, value, strong = false) =>
    `<tr>
      <td colspan="2" style="padding:${strong ? "12px" : "5px"} 0 0;font-family:${SANS};font-size:${strong ? "15px" : "13px"};color:${strong ? C.forest : C.muted};${strong ? "font-weight:700;" : ""}">${esc(label)}</td>
      <td align="right" style="padding:${strong ? "12px" : "5px"} 0 0;${NUM}font-size:${strong ? "22px" : "14px"};${strong ? "font-weight:700;" : ""}color:${strong ? C.forest : C.ink};white-space:nowrap;">${value}</td>
    </tr>`;

  const body = `
    ${h1(`Đơn hàng mới <span style="${NUM}font-size:24px;font-weight:700;letter-spacing:1px;color:${C.sage};">${esc(order.code)}</span>`)}
    <p style="margin:8px 0 0;text-align:center;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};">Đặt lúc ${when(order.createdAt)} · ${payLabel}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;background:${C.linen};border-radius:14px;">
      <tr><td align="center" style="padding:18px 18px 20px;text-align:center;">
        <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Tổng thanh toán</div>
        <div style="margin-top:6px;${NUM}font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;color:${C.forest};white-space:nowrap;">${vnd(order.total)}</div>
      </td></tr>
    </table>

    ${sectionTitle("Khách hàng")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Họ tên", `<strong style="font-weight:600;">${esc(c.name)}</strong>`)}
      ${row("Điện thoại", phoneLink(c.phone))}
      ${row("Địa chỉ", esc([c.address, c.province].filter(Boolean).join(", ")))}
      ${order.lang === "en" ? row("Ngôn ngữ", EN_PILL) : ""}
      ${row(
        "Thanh toán",
        transfer
          ? pill(
              order.paymentClaimedAt
                ? "Khách báo đã chuyển khoản — cần kiểm tra"
                : "Chuyển khoản — chờ nhận tiền",
              C.amber,
              C.amberBg,
            )
          : pill("COD — thu khi giao", C.forest, C.sage50),
      )}
      ${transfer ? row("Nội dung CK", `<strong style="${NUM}font-weight:700;letter-spacing:1px;">${esc(order.code)}</strong>`) : ""}
    </table>
    ${order.adminNote ? `${sectionTitle("Lưu ý")}${noteBox(order.adminNote)}` : ""}
    ${c.note ? `${sectionTitle("Ghi chú của khách")}${noteBox(c.note)}` : ""}

    ${sectionTitle("Sản phẩm")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${items}
    </table>
    ${summaryHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${summaryHtml ? "10px" : "0"};">
      ${money("Tạm tính", vnd(order.subtotal))}
      ${money("Phí vận chuyển", order.shippingFee ? vnd(order.shippingFee) : `<span style="color:${C.sage};font-weight:700;">Miễn phí</span>`)}
      ${money("Tổng cộng", vnd(order.total), true)}
    </table>

    ${adminLink ? button(adminLink, "Mở đơn trong trang quản trị") : ""}
    <p style="margin:14px auto 0;max-width:460px;text-align:center;font-family:${SANS};font-size:12.5px;line-height:1.6;color:${C.muted};">${
      transfer
        ? `Khách đã bấm “Xác nhận đã thanh toán”. Kiểm tra sao kê có khoản ${vnd(order.total)} với nội dung <strong>${esc(order.code)}</strong>,<br>rồi bấm “Xác nhận đã thanh toán” trong trang quản&nbsp;trị.`
        : "Gọi xác nhận với khách trong giờ&nbsp;làm&nbsp;việc,<br>sau đó chuyển trạng thái đơn trong trang quản&nbsp;trị."
    }</p>`;

  const text = [
    `ĐƠN HÀNG MỚI ${order.code} — ${vnd(order.total)}`,
    `Đặt lúc: ${when(order.createdAt)} · ${payLabel}`,
    transfer
      ? `Chuyển khoản: KHÁCH BÁO ĐÃ CHUYỂN — kiểm tra sao kê có khoản ${vnd(order.total)} nội dung "${order.code}" rồi bấm "Xác nhận đã thanh toán".`
      : null,
    "",
    `Khách hàng: ${c.name}`,
    `Điện thoại: ${prettyPhone(c.phone)}`,
    `Địa chỉ: ${[c.address, c.province].filter(Boolean).join(", ")}`,
    order.lang === "en" ? EN_TEXT : null,
    c.note ? `Ghi chú: ${c.note}` : null,
    order.adminNote ? `Lưu ý: ${order.adminNote}` : null,
    "",
    "Sản phẩm:",
    ...order.lines.map(
      (l) =>
        `- ${l.name}${l.optionLabel ? ` (${l.optionLabel})` : ""} [cần chuẩn bị: ${packText(l)}]: ${l.qty} × ${vnd(l.price)} = ${vnd(l.lineTotal)}`,
    ),
    ...(summary?.length
      ? [
          "",
          "TỔNG CẦN CHUẨN BỊ CHO ĐƠN NÀY:",
          ...summary.map((s) => `- ${s.name}: ${s.count}${s.unit ? ` ${s.unit}` : ""}`),
          "",
        ]
      : []),
    `Tạm tính: ${vnd(order.subtotal)}`,
    `Phí vận chuyển: ${order.shippingFee ? vnd(order.shippingFee) : "Miễn phí"}`,
    `TỔNG CỘNG: ${vnd(order.total)}`,
    adminLink ? `\nMở đơn: ${adminLink}` : null,
  ]
    .filter((x) => x !== null)
    .join("\n");

  return {
    subject: `[Mayqueen] Đơn hàng mới ${order.code} – ${vnd(order.total)}${transfer ? " (chuyển khoản)" : ""} – ${c.name}`,
    html: layout({
      siteUrl,
      preheader: `${c.name} · ${prettyPhone(c.phone)} · ${vnd(order.total)}`,
      eyebrow: "Đơn hàng mới",
      body,
    }),
    text,
  };
}

/** Email "Yêu cầu tư vấn mới" */
export function leadEmail(lead, { siteUrl = "", updated = false } = {}) {
  const adminLink = siteUrl ? `${siteUrl}/admin/tu-van?q=${encodeURIComponent(lead.phone)}` : "";
  const title = updated ? "Khách cập nhật yêu cầu tư vấn" : "Yêu cầu tư vấn mới";
  const sub = updated
    ? `Cập nhật lúc ${when(lead.updatedAt)} · khách gửi lại form, thông tin bên dưới là bản mới nhất`
    : `Gửi lúc ${when(lead.createdAt)} · từ popup "Tư vấn miễn phí" trên website`;
  const body = `
    ${h1(title)}
    <p style="margin:8px 0 0;text-align:center;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};">${esc(sub)}</p>

    ${sectionTitle("Khách hàng")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Họ tên", `<strong style="font-weight:600;">${esc(lead.name)}</strong>`)}
      ${row("Điện thoại", phoneLink(lead.phone))}
      ${lead.goal ? row("Quan tâm", pill(lead.goal, C.forest, C.sage50)) : ""}
      ${lead.lang === "en" ? row("Ngôn ngữ", EN_PILL) : ""}
    </table>
    ${lead.note ? `${sectionTitle("Khách chia sẻ")}${noteBox(lead.note)}` : ""}

    ${adminLink ? button(adminLink, "Mở trong trang quản trị") : ""}
    <p style="margin:14px auto 0;max-width:460px;text-align:center;font-family:${SANS};font-size:12.5px;line-height:1.6;color:${C.muted};">Website cam kết liên hệ lại khách trong vòng 24&nbsp;giờ.<br>Gọi sớm để giữ trải nghiệm tốt cho&nbsp;khách.</p>`;

  const text = [
    title.toUpperCase(),
    sub,
    "",
    `Họ tên: ${lead.name}`,
    `Điện thoại: ${prettyPhone(lead.phone)}`,
    lead.goal ? `Quan tâm: ${lead.goal}` : null,
    lead.lang === "en" ? EN_TEXT : null,
    lead.note ? `Khách chia sẻ: ${lead.note}` : null,
    adminLink ? `\nMở trong trang quản trị: ${adminLink}` : null,
  ]
    .filter((x) => x !== null)
    .join("\n");

  return {
    subject: `[Mayqueen] ${title} – ${lead.name} – ${prettyPhone(lead.phone)}`,
    html: layout({
      siteUrl,
      preheader: `${lead.name} · ${prettyPhone(lead.phone)}${lead.goal ? ` · ${lead.goal}` : ""}`,
      eyebrow: updated ? "Cập nhật tư vấn" : "Tư vấn mới",
      body,
    }),
    text,
  };
}
