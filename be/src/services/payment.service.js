import { env } from "../config/env.js";

/**
 * Thanh toán: COD hoặc chuyển khoản ngân hàng qua mã VietQR.
 *
 * VietQR = chuẩn QR thanh toán EMVCo của NAPAS. Mã "động" chứa sẵn ngân hàng + số tài khoản + SỐ TIỀN + NỘI DUNG
 * → khách quét bằng bất kỳ app ngân hàng nào là mọi thông tin tự điền, chỉ việc xác nhận. Nội dung chuyển khoản
 * = MÃ ĐƠN (VD MQ7K3P9X) → admin đối chiếu sao kê với đúng đơn.
 * Chuỗi QR được dựng tại đây (không gọi dịch vụ ngoài), frontend chỉ vẽ chuỗi thành ảnh QR.
 */

export const PAYMENT = Object.freeze({ COD: "cod", BANK: "bank_transfer" });

/** Phí ship: chuyển khoản trước → luôn miễn phí; COD → miễn phí khi đủ ngưỡng */
export function shippingFeeFor(subtotal, paymentMethod) {
  if (paymentMethod === PAYMENT.BANK) return 0;
  return subtotal >= env.order.freeShipThreshold ? 0 : env.order.shippingFee;
}

/** 1 trường EMVCo: ID (2 số) + độ dài (2 số) + giá trị */
const tlv = (id, value) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT (khởi tạo 0xFFFF, đa thức 0x1021) — bắt buộc ở trường 63 của mã EMVCo */
export function crc16(input) {
  let crc = 0xffff;
  for (const byte of Buffer.from(input, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Chuỗi VietQR động (chuyển tiền nhanh 24/7 tới tài khoản).
 * Nội dung chỉ giữ chữ / số / khoảng trắng (một số ngân hàng từ chối ký tự đặc biệt), tối đa 25 ký tự.
 */
export function vietQrPayload({ bin, accountNo, amount, content }) {
  const purpose = String(content ?? "")
    .replace(/[^0-9A-Za-z ]/g, "")
    .slice(0, 25);
  const body = [
    tlv("00", "01"), // phiên bản
    tlv("01", "12"), // 12 = mã động (dùng 1 lần, có số tiền)
    tlv(
      "38",
      tlv("00", "A000000727") +
        tlv("01", tlv("00", bin) + tlv("01", accountNo)) +
        tlv("02", "QRIBFTTA"),
    ),
    tlv("53", "704"), // VND
    ...(amount > 0 ? [tlv("54", String(Math.round(amount)))] : []),
    tlv("58", "VN"),
    ...(purpose ? [tlv("62", tlv("08", purpose))] : []),
  ].join("");
  const withCrcTag = `${body}6304`;
  return withCrcTag + crc16(withCrcTag);
}

/** Đơn chuyển khoản đã nhận tiền chưa (đơn cũ chưa có trường paymentStatus = chưa) */
export const isPaid = (order) => order?.paymentStatus === "paid";

/**
 * Thông tin chuyển khoản cho 1 đơn (hiện cho khách: QR + STK + số tiền + nội dung).
 * null khi đơn không phải chuyển khoản hoặc chưa cấu hình tài khoản.
 */
export function bankTransferInfo(order) {
  if (order?.paymentMethod !== PAYMENT.BANK || !env.bank.enabled) return null;
  const { bin, name, accountNo, accountName } = env.bank;
  return {
    bankName: name,
    bin,
    accountNo,
    accountName,
    amount: order.total,
    content: order.code,
    qr: vietQrPayload({ bin, accountNo, amount: order.total, content: order.code }),
  };
}
