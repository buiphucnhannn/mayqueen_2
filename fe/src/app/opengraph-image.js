import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Ảnh chia sẻ Facebook/Zalo: ảnh sản phẩm + logo B.O.T + khẩu hiệu.
export const alt = "Mayqueen Slim — Thon gọn từ bên trong";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dataUrl = async (file, mime) =>
  `data:${mime};base64,${(await readFile(path.join(process.cwd(), "public", file))).toString("base64")}`;

export default async function OpengraphImage() {
  const [photo, logo] = await Promise.all([
    dataUrl("images/products/mayqueen-slim/mayqueen-fern.jpg", "image/jpeg"),
    dataUrl("images/brand/logo-bot-horizontal.png", "image/png"),
  ]);

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8f5ec" }}>
      <div
        style={{
          width: 640,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo} width={210} height={80} />
        <div style={{ fontSize: 84, color: "#1e3a28", marginTop: 40, lineHeight: 1 }}>
          Mayqueen Slim
        </div>
        <div style={{ fontSize: 40, color: "#5f7d41", marginTop: 20 }}>Thon gọn từ bên trong</div>
        <div style={{ fontSize: 24, color: "#4b5a50", marginTop: 28 }}>
          Thực phẩm bảo vệ sức khỏe - Hỗ trợ giảm béo
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={photo} width={560} height={630} style={{ objectFit: "cover" }} />
    </div>,
    size,
  );
}
