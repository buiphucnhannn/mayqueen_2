import { t } from "@/i18n";
import { certificateImages as C } from "./images";

/**
 * Khối "Chứng nhận" — nguồn: docs/MAYQUEEN SLIM(certificate).pdf (khách gửi 20/10/2026), 12 trang.
 * - certificates: giấy chứng nhận chính (ô lớn). Ô có images: [] (chưa có ảnh) được ẨN tới khi có ảnh;
 *   chỉ cần thêm ảnh vào public/images/certificates/ và điền đường dẫn là tự hiện.
 * - testReports: 9 phiếu kiểm nghiệm nguyên liệu (trang 4–12 của PDF), mỗi phiếu 1 ô nhỏ.
 */
export const certificates = [
  {
    id: "cong-bo",
    title: t("Giấy tiếp nhận đăng ký bản công bố sản phẩm", "Product declaration receipt"),
    issuer: t(
      "Cục An toàn thực phẩm – Bộ Y tế - Số 6926/2021/ĐKSP",
      "Vietnam Food Administration - No. 6926/2021/ĐKSP",
    ),
    images: [C.congBo],
  },
  {
    id: "gmp",
    title: t("Chứng nhận GMP nhà máy sản xuất", "GMP certificate of the manufacturer"),
    issuer: t(
      "Cục An toàn thực phẩm - Số 69/2023/ATTP-CNGMP - Goldcare",
      "Vietnam Food Administration - No. 69/2023/ATTP-CNGMP - Goldcare",
    ),
    images: [C.gmp],
  },
  {
    id: "iso",
    title: t("Chứng nhận ISO 22000:2018", "ISO 22000:2018 certificate"),
    issuer: t(
      "Good Việt Nam - Hệ thống quản lý an toàn thực phẩm",
      "Good Vietnam - Food safety management system",
    ),
    images: [C.iso],
  },
  {
    id: "quang-cao",
    title: t("Giấy xác nhận nội dung quảng cáo", "Advertising content approval"),
    issuer: t("[Đơn vị cấp]", "[Issuer]"),
    images: [],
  },
  {
    id: "bot",
    title: t("Giấy phép B.O.T Việt Nam", "B.O.T Vietnam business licence"),
    issuer: t("[Đơn vị cấp]", "[Issuer]"),
    images: [],
  },
];

// Phiếu kiểm nghiệm (COA) — tên nguyên liệu + đơn vị cấp, đọc từ chính từng phiếu
export const testReports = [
  { name: "Chitosan", issuer: "Yangzhou Rixing Bio-Tech", image: C.coa[0] },
  {
    name: t("Chiết xuất trà xanh", "Green tea extract"),
    issuer: "Xi'an Faitury Bio-Tech",
    image: C.coa[1],
  },
  {
    name: t("Chiết xuất Polypodium leucotomos", "Polypodium leucotomos extract"),
    issuer: "Hunan Huacheng Biotech",
    image: C.coa[2],
  },
  {
    name: t("Chiết xuất ngưu tất", "Achyranthes bidentata extract"),
    issuer: "Xi'an Faitury Bio-Tech",
    image: C.coa[3],
  },
  {
    name: t("Ngưu tất — phiếu thử nghiệm", "Achyranthes — test report"),
    issuer: t("Viện IRDOP (Việt Nam)", "IRDOP Institute (Vietnam)"),
    image: C.coa[4],
  },
  { name: "L-Glutamine", issuer: "Hebei Huayang Biological Technology", image: C.coa[5] },
  {
    name: t("Chiết xuất men gạo đỏ", "Red yeast rice extract"),
    issuer: "Hunan Huacheng Biotech",
    image: C.coa[6],
  },
  {
    name: t("Collagen peptide cá", "Fish collagen peptide"),
    issuer: "Wellnex (Nitta Gelatin)",
    image: C.coa[7],
  },
  {
    name: t("Vitamin C (Ascorbic acid)", "Vitamin C (ascorbic acid)"),
    issuer: "Luwei Pharmaceutical Group",
    image: C.coa[8],
  },
];
