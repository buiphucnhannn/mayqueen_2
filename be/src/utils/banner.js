import mongoose from "mongoose";
import { adminConfigured } from "../config/admin.js";
import { env } from "../config/env.js";

/**
 * Khung thông tin in ra terminal khi server khởi động xong.
 * Chỉ dùng ký tự ASCII + màu ANSI → hiển thị đúng trên mọi terminal Windows (PowerShell, CMD)
 * không bị lỗi font như emoji / tiếng Việt có dấu.
 */
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};
const paint = (color, text) => `${c[color]}${text}${c.reset}`;
// eslint-disable-next-line no-control-regex -- bỏ mã màu ANSI để tính đúng độ rộng
const visibleLength = (s) => s.replace(/\x1b\[\d+m/g, "").length;

export function printStartupBanner({ name, version }) {
  // Production: log được lưu lại trên server → chỉ in 1 dòng trạng thái, không lộ host DB / tài khoản admin
  if (env.isProd) {
    const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    process.stdout.write(
      `${name} v${version} ready - port ${env.port}, db ${db}, admin ${adminConfigured() ? "on" : "off"}, uploads ${env.cloudinary.enabled ? "on" : "off"}${env.demoLogin ? ", DEMO LOGIN ON (no password!)" : ""}\n`,
    );
    return;
  }

  const base = `http://localhost:${env.port}/api/v1`;
  const db = mongoose.connection;
  const rows = [
    ["Environment", paint("yellow", env.nodeEnv)],
    ["API", paint("cyan", base)],
    ["Health", paint("cyan", `${base}/health`)],
    ["MongoDB", `${paint("green", "connected")} ${paint("dim", `${db.name} @ ${db.host}`)}`],
    [
      "Admin login",
      adminConfigured()
        ? `${paint("green", "enabled")} ${paint("dim", `user: ${env.admin.id}`)}`
        : paint("yellow", "ADMIN_ID / ADMIN_PASSWORD not set"),
    ],
    [
      "Demo login",
      env.demoLogin
        ? paint("yellow", "ON - nut dang nhap nhanh, khong can mat khau (DEMO_LOGIN=true)")
        : paint("dim", "off"),
    ],
    [
      "Cloudinary",
      env.cloudinary.enabled
        ? `${paint("green", "configured")} ${paint("dim", env.cloudinary.cloudName)}`
        : paint("yellow", "not configured (uploads disabled)"),
    ],
    [
      "Email notify",
      env.mail.enabled
        ? `${paint("green", "Resend")} ${paint("dim", `→ ${env.mail.to.join(", ")}`)}`
        : paint("yellow", "off (RESEND_API_KEY / ADMIN_NOTIFY_EMAILS)"),
    ],
  ];

  const title = `${paint("bold", name)} ${paint("dim", `v${version}`)}  ${paint("green", "ready")}`;
  const lines = [title, "", ...rows.map(([k, v]) => `${paint("dim", k.padEnd(12))} ${v}`)];
  const width = Math.max(...lines.map(visibleLength)) + 4;
  const border = paint("dim", `+${"-".repeat(width)}+`);
  const pad = (s) =>
    `${paint("dim", "|")}  ${s}${" ".repeat(width - visibleLength(s) - 2)}${paint("dim", "|")}`;

  process.stdout.write(`\n${border}\n${lines.map(pad).join("\n")}\n${border}\n\n`);
}
