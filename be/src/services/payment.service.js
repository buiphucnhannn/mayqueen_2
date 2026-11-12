import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

/**
 * Thanh toán: COD hoặc chuyển khoản ngân hàng qua mã VietQR.
 *
 * VietQR = chuẩn QR thanh toán EMVCo của NAPAS. Mã "động" chứa sẵn ngân hàng + số tài khoản + SỐ TIỀN + NỘI DUNG
 * → khách quét bằng bất kỳ app ngân hàng nào là mọi thông tin tự điền, chỉ việc xác nhận. Nội dung chuyển khoản
 * = MÃ ĐƠN (VD MQ7K3P9X) → admin đối chiếu sao kê với đúng đơn.
 *
 * Luồng chuyển khoản: khách chọn "Chuyển khoản" → server CẤP TRƯỚC mã đơn (kèm chữ ký paymentRef) → QR hiện ngay ở
 * trang thanh toán với nội dung = mã đó → khách chuyển tiền rồi bấm "Xác nhận đã thanh toán" → đơn được tạo với
 * ĐÚNG mã đó (chữ ký chứng minh mã do server cấp, không tự bịa / chiếm mã được).
 */

export const PAYMENT = Object.freeze({ COD: "cod", BANK: "bank_transfer" });

// khóa ký riêng cho paymentRef (dẫn xuất từ secret JWT, không dùng trực tiếp secret đăng nhập)
const refKey = createHmac("sha256", env.jwt.refreshSecret).update("mq-payment-ref-v1").digest();
const refSig = (code) => createHmac("sha256", refKey).update(code).digest("base64url").slice(0, 32);

/** paymentRef = "<mã đơn>.<chữ ký>" — trình duyệt giữ lại, gửi kèm khi bấm "Xác nhận đã thanh toán" */
export const signPaymentRef = (code) => `${code}.${refSig(code)}`;

/** Kiểm tra paymentRef → mã đơn hợp lệ, hoặc null (giả mạo / sai định dạng) */
export function verifyPaymentRef(ref) {
  const m = /^(MQ[0-9A-Z]{6})\.([A-Za-z0-9_-]{32})$/.exec(String(ref ?? ""));
  if (!m) return null;
  const want = Buffer.from(refSig(m[1]));
  const got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got) ? m[1] : null;
}

/** Thông tin tài khoản nhận tiền (công khai — in trên mã QR) */
export const bankAccount = () => ({
  bankName: env.bank.name,
  bin: env.bank.bin,
  accountNo: env.bank.accountNo,
  accountName: env.bank.accountName,
});

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
