/**
 * Chuỗi VietQR động (chuẩn EMVCo / NAPAS): ngân hàng + số tài khoản + SỐ TIỀN + NỘI DUNG.
 * Dựng ngay trên trình duyệt để QR ở trang thanh toán đổi theo tổng tiền tức thì (khách tăng / giảm số lượng).
 * Giữ ĐỒNG BỘ với be/src/services/payment.service.js (vietQrPayload, crc16) — QR ở màn đặt xong / tra cứu đơn
 * do backend dựng, phải ra cùng một chuỗi.
 */

const tlv = (id, value) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT (khởi tạo 0xFFFF, đa thức 0x1021) — trường 63 bắt buộc của mã EMVCo */
export function crc16(input) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function vietQrPayload({ bin, accountNo, amount, content }) {
  const purpose = String(content ?? "")
    .replace(/[^0-9A-Za-z ]/g, "")
    .slice(0, 25);
  const body = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv(
      "38",
      tlv("00", "A000000727") +
        tlv("01", tlv("00", bin) + tlv("01", accountNo)) +
        tlv("02", "QRIBFTTA"),
    ),
    tlv("53", "704"),
    ...(amount > 0 ? [tlv("54", String(Math.round(amount)))] : []),
    tlv("58", "VN"),
    ...(purpose ? [tlv("62", tlv("08", purpose))] : []),
  ].join("");
  const withCrcTag = `${body}6304`;
  return withCrcTag + crc16(withCrcTag);
}
