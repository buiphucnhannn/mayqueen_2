import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { orderRepository } from "../repositories/order.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { notifyService } from "./notify.service.js";
import { PAYMENT, bankTransferInfo, isPaid, shippingFeeFor } from "./payment.service.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPageMeta } from "../utils/pagination.js";
import { searchRegex } from "../utils/search.js";
import { assertNotStale } from "../utils/stale.js";
import { toDTO } from "../utils/serialize.js";
import { unitsFromProducts } from "../utils/pack.js";

/** Mã đơn ngắn, dễ đọc qua điện thoại: MQ + 6 ký tự (bỏ 0/O/1/I dễ nhầm) */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function makeCode() {
  const bytes = randomBytes(6);
  return `MQ${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

async function uniqueCode() {
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    if (!(await orderRepository.codeExists(code))) return code;
  }
  throw new Error("Không tạo được mã đơn hàng duy nhất");
}

const pick = (localized, lang) => localized?.[lang] || localized?.vi || "";

/** Kết quả trả khách sau khi đặt (cả khi gửi lại trùng): mã đơn, tổng, hình thức + thông tin chuyển khoản */
const placedResult = (order, extra = {}) => ({
  orderId: order.code,
  total: order.total,
  paymentMethod: order.paymentMethod ?? PAYMENT.COD,
  paymentStatus: order.paymentStatus ?? "unpaid",
  payment: bankTransferInfo(order),
  ...extra,
});

/** Đơn chuyển khoản còn cần khách trả tiền → hiện lại QR khi khách tra cứu */
const awaitingTransfer = (order) =>
  order.paymentMethod === PAYMENT.BANK && !isPaid(order) && order.status !== "cancelled";

/**
 * Đơn đặt TRƯỚC khi có trường optionNote (thành phần gói) → lấy từ gói hiện tại của sản phẩm để hiển thị
 * (chỉ khi đọc, KHÔNG ghi vào đơn). Đơn mới đã lưu sẵn optionNote lúc đặt nên không bị đổi theo khi admin sửa gói.
 */
async function withOptionNotes(orders) {
  const list = (Array.isArray(orders) ? orders : [orders]).filter(Boolean);
  const missing = list.flatMap((o) => o.lines ?? []).filter((l) => l.optionNote === undefined);
  if (missing.length) {
    const products = await productRepository.findOptionsByIds([
      ...new Set(missing.map((l) => String(l.product))),
    ]);
    const byId = new Map(products.map((p) => [String(p._id), p]));
    for (const o of list)
      for (const l of o.lines ?? []) {
        if (l.optionNote !== undefined) continue;
        const option = byId.get(String(l.product))?.options.find((x) => x.optionId === l.optionId);
        l.optionNote = option ? pick(option.note, o.lang ?? "vi") : "";
      }
  }
  return orders;
}

export const orderService = {
  /**
   * Tạo đơn: GIÁ LUÔN TÍNH LẠI từ DB (không tin giá gửi từ trình duyệt),
   * gộp các dòng trùng sản phẩm + gói, áp phí ship theo hình thức thanh toán
   * (chuyển khoản trước → miễn phí vận chuyển; COD → miễn phí khi đủ ngưỡng).
   */
  async create({
    customer,
    items,
    lang,
    paymentMethod = PAYMENT.COD,
    consent,
    idempotencyKey,
    expectedTotal,
    suspected = false,
  }) {
    // Gửi lại cùng 1 lần đặt (mạng chập chờn: đơn đã lưu nhưng khách không nhận được phản hồi) → trả đơn cũ
    if (idempotencyKey) {
      const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return placedResult(existing, { duplicate: true });
    }

    // Chưa cấu hình tài khoản nhận tiền (BANK_ACCOUNT_NO rỗng) → không nhận đơn chuyển khoản
    if (paymentMethod === PAYMENT.BANK && !env.bank.enabled)
      throw new ApiError(422, "Hình thức chuyển khoản tạm thời chưa hỗ trợ", {
        code: "PAYMENT_METHOD_UNAVAILABLE",
        details: [{ field: "body.paymentMethod" }],
      });

    const products = await productRepository.findActiveBySlugs([
      ...new Set(items.map((i) => i.slug)),
    ]);
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    // Món đã ngừng bán / bị ẩn / gói bị xoá → báo đủ danh sách để website bỏ khỏi giỏ và báo khách
    const unavailable = items.filter(
      (it) => !bySlug.get(it.slug)?.options.some((o) => o.optionId === it.optionId),
    );
    if (unavailable.length)
      throw new ApiError(422, "Một số sản phẩm trong giỏ không còn bán", {
        code: "ITEM_UNAVAILABLE",
        details: unavailable.map(({ slug, optionId }) => ({ field: "items", slug, optionId })),
      });

    const merged = new Map();
    for (const it of items) {
      const product = bySlug.get(it.slug);
      const option = product.options.find((o) => o.optionId === it.optionId);
      const key = `${it.slug}:${it.optionId}`;
      const prev = merged.get(key);
      const qty = Math.min(99, (prev?.qty ?? 0) + it.qty);
      merged.set(key, {
        product: product._id,
        slug: product.slug,
        name: pick(product.name, lang),
        optionId: option.optionId,
        optionLabel: pick(option.label, lang),
        optionNote: pick(option.note, lang),
        price: option.price,
        qty,
        lineTotal: option.price * qty,
      });
    }

    const lines = [...merged.values()];
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const shippingFee = shippingFeeFor(subtotal, paymentMethod);
    const total = subtotal + shippingFee;

    // Giá vừa đổi (admin sửa giá khi khách đang ở trang thanh toán) → KHÔNG tự tạo đơn với số tiền khác số khách
    // đã thấy (thu COD sai kỳ vọng). Báo tổng mới, website tải lại giá để khách xác nhận lại.
    if (expectedTotal !== undefined && expectedTotal !== total)
      throw new ApiError(409, "Giá sản phẩm vừa được cập nhật", {
        code: "PRICE_CHANGED",
        details: { subtotal, shippingFee, total },
      });

    let order;
    try {
      order = await orderRepository.create({
        code: await uniqueCode(),
        customer,
        lines,
        subtotal,
        shippingFee,
        total,
        paymentMethod,
        lang,
        ...(consent && { consent }),
        ...(idempotencyKey && { idempotencyKey }),
        ...(suspected && {
          adminNote: "⚠ Nghi là bot (ô ẩn chống spam bị điền) — gọi xác nhận trước khi giao.",
        }),
      });
    } catch (err) {
      // 2 lần gửi cùng mã chạy song song → lần sau trùng index → trả đơn của lần trước
      if (err?.code === 11000 && idempotencyKey && err.keyPattern?.idempotencyKey) {
        const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) return placedResult(existing, { duplicate: true });
      }
      throw err;
    }

    const saved = order.toObject ? order.toObject() : order;
    // Email cho admin (chạy nền, không làm chậm khách): kèm đơn vị kho để in "Tổng cần chuẩn bị" (lọ / hộp).
    // Đọc sản phẩm lỗi → vẫn gửi email, tổng kết chỉ thiếu chữ đơn vị.
    productRepository
      .findPackUnitsSource()
      .then(unitsFromProducts)
      .catch(() => ({}))
      .then((units) => notifyService.newOrder(saved, { units }));
    return placedResult(saved);
  },

  /** Khách tra cứu đơn bằng mã + SĐT (không lộ đơn của người khác) */
  async track(code, phone) {
    const order = await orderRepository.findByCode(code.toUpperCase());
    if (!order || order.customer.phone !== phone) throw ApiError.notFound("Order not found");
    await withOptionNotes(order);
    const { code: orderId, status, lines, subtotal, shippingFee, total, createdAt } = order;
    return {
      orderId,
      status,
      lines,
      subtotal,
      shippingFee,
      total,
      createdAt,
      paymentMethod: order.paymentMethod ?? PAYMENT.COD,
      paymentStatus: order.paymentStatus ?? "unpaid",
      // chỉ gửi QR / số tài khoản khi khách còn phải chuyển khoản
      payment: awaitingTransfer(order) ? bankTransferInfo(order) : null,
    };
  },

  async list({ status, q, payment }, pagination) {
    const rx = q && searchRegex(q);
    const paymentFilter = {
      cod: { paymentMethod: PAYMENT.COD },
      bank_transfer: { paymentMethod: PAYMENT.BANK },
      // khớp con số "chờ nhận tiền" ở stats(): không tính đơn đã hủy
      awaiting: {
        paymentMethod: PAYMENT.BANK,
        paymentStatus: { $ne: "paid" },
        status: { $ne: "cancelled" },
      },
      paid: { paymentStatus: "paid" },
    }[payment];
    // $and: điều kiện trạng thái của bộ lọc thanh toán không ghi đè tab trạng thái đang chọn
    const conds = [
      status && { status },
      paymentFilter,
      rx && { $or: [{ code: rx }, { "customer.phone": rx }, { "customer.name": rx }] },
    ].filter(Boolean);
    const filter = conds.length ? { $and: conds } : {};
    const { items, total } = await orderRepository.paginate(filter, pagination);
    return { items: toDTO(await withOptionNotes(items)), meta: buildPageMeta(pagination, total) };
  },

  /** Số đơn theo trạng thái (tab lọc + tổng quan) */
  async stats() {
    const [byStatus, awaitingPayment] = await Promise.all([
      orderRepository.countBy("status"),
      orderRepository.countAwaitingPayment(),
    ]);
    const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
    return { total, byStatus, awaitingPayment };
  },

  async getById(id) {
    const order = await orderRepository.findById(id);
    if (!order) throw ApiError.notFound("Order not found");
    return toDTO(await withOptionNotes(order));
  },

  async update(id, { expectedUpdatedAt, ...changes }) {
    if (expectedUpdatedAt || changes.paymentStatus) {
      const current = await orderRepository.findById(id);
      if (!current) throw ApiError.notFound("Order not found");
      if (expectedUpdatedAt) assertNotStale(current, expectedUpdatedAt);
      // COD thu tiền khi giao (qua đơn vị vận chuyển) → chỉ đơn chuyển khoản mới xác nhận nhận tiền ở đây
      if (changes.paymentStatus && current.paymentMethod !== PAYMENT.BANK)
        throw new ApiError(422, "Chỉ xác nhận thanh toán cho đơn chuyển khoản", {
          code: "NOT_BANK_TRANSFER",
        });
    }
    const order = await orderRepository.updateAdmin(id, changes);
    if (!order) throw ApiError.notFound("Order not found");
    return toDTO(await withOptionNotes(order));
  },

  /**
   * Đơn hàng là chứng từ bán hàng → chỉ cho xóa đơn "Đã hủy" (đơn ảo, spam, đặt nhầm).
   * Đơn đang xử lý / đã hoàn tất phải chuyển "Đã hủy" trước.
   */
  async remove(id) {
    const order = await orderRepository.deleteCancelled(id);
    if (order) return order;
    if (await orderRepository.exists({ _id: id }))
      throw ApiError.conflict("Chỉ xóa được đơn đã hủy — hãy chuyển đơn sang “Đã hủy” trước.");
    throw ApiError.notFound("Order not found");
  },
};
