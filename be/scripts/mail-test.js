/**
 * Gửi THỬ email thông báo (đơn hàng + tư vấn) tới ADMIN_NOTIFY_EMAILS bằng dữ liệu mẫu — không ghi DB.
 *   npm run mail:test              → gửi thật qua Resend (cần RESEND_API_KEY, ADMIN_NOTIFY_EMAILS trong .env)
 *   npm run mail:test -- --preview → chỉ xuất 2 file HTML vào be/mail-preview/ để mở xem (không cần key)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { env } from "../src/config/env.js";
import { leadEmail, orderEmail } from "../src/emails/templates.js";
import { sendMail } from "../src/services/notify.service.js";

const sampleOrder = {
  code: "MQTEST01",
  createdAt: new Date(),
  customer: {
    name: "Nguyễn Thị Mai",
    phone: "0912345678",
    address: "Số 12 ngõ 45 Tô Hiệu, Hà Đông",
    province: "Hà Nội",
    note: "Giao giờ hành chính giúp mình. Gọi trước khi giao nhé!",
  },
  lines: [
    {
      name: "Mayqueen Slim",
      optionLabel: "1 lọ (30 viên)",
      qty: 1,
      price: 550000,
      lineTotal: 550000,
    },
    {
      name: "Yodetox Extra",
      optionLabel: "1 hộp (20 gói)",
      qty: 2,
      price: 260000,
      lineTotal: 520000,
    },
  ],
  subtotal: 1070000,
  shippingFee: 0,
  total: 1070000,
};
const sampleLead = {
  _id: "test-lead",
  createdAt: new Date(),
  name: "Trần Thu Hà",
  phone: "0987654321",
  goal: "Giảm mỡ thừa, vòng bụng",
  note: "Mình cao 1m58, nặng 62kg, sau sinh 1 năm. Muốn được tư vấn liệu trình phù hợp.",
};

const opts = { siteUrl: env.mail.siteUrl };
const mails = [
  ["don-hang", orderEmail(sampleOrder, opts)],
  ["tu-van", leadEmail(sampleLead, opts)],
];

if (process.argv.includes("--preview")) {
  await mkdir("mail-preview", { recursive: true });
  for (const [name, m] of mails) await writeFile(`mail-preview/${name}.html`, m.html);
  console.log(
    "Đã xuất mail-preview/don-hang.html và mail-preview/tu-van.html — mở bằng trình duyệt để xem.",
  );
  process.exit(0);
}

if (!env.mail.enabled) {
  console.error(
    "Chưa cấu hình: điền RESEND_API_KEY và ADMIN_NOTIFY_EMAILS trong be/.env (xem .env.example).",
  );
  process.exit(1);
}
console.log(`Gửi thử tới: ${env.mail.to.join(", ")} (từ ${env.mail.from})`);
for (const [name, m] of mails) {
  try {
    const { id } = await sendMail({ subject: `[THỬ] ${m.subject}`, html: m.html, text: m.text });
    console.log(`  ✓ ${name}: đã gửi (id ${id})`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}
