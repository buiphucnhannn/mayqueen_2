import Image from "@/components/ui/Img";
import Link from "next/link";
import {
  Building2,
  Clock,
  Hash,
  Mail,
  MapPin,
  Navigation,
  PackageSearch,
  Phone,
} from "lucide-react";
import MapEmbed from "@/components/common/MapEmbed";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import { FacebookIcon, TikTokIcon, ZaloIcon } from "@/components/ui/BrandIcons";
import { brand } from "@/data/images";
import { href } from "@/i18n";

/**
 * Khối 6 — Chân trang (nền tối), 2 tầng + dải đáy:
 * 1. Thương hiệu (logo, giới thiệu, mạng xã hội) | 3 cột link | Liên hệ (hotline nổi bật, email, giờ).
 *    Máy tính: lưới 12 cột 3-2-2-2-3 → cột Liên hệ đủ rộng, email / giờ làm việc không bị ngắt dòng.
 *    Tablet: thương hiệu chiếm 1 hàng, 3 cột link, liên hệ xếp ngang. Điện thoại: 2 cột.
 * 2. Thông tin doanh nghiệp (tên pháp lý, địa chỉ trụ sở, MST) | Bản đồ Google thật + nút chỉ đường.
 * 3. Dải đáy: dấu B.O.T + cam kết chính hãng & lưu ý TPBVSK | bản quyền.
 */
// Tiêu đề cột là h2 (chân trang không có h2 riêng → tránh nhảy h1 → h3 ở trang ít nội dung như Thanh toán)
const heading = "text-sage-300 text-[11px] font-semibold tracking-[0.22em] uppercase";
const iconCls = "text-sage-300 mt-0.5 size-4 shrink-0";

export default function Footer({ lang, site, footer, products, policies, articleCategories }) {
  const socials = [
    { label: "Facebook", url: site.facebook, Icon: FacebookIcon },
    { label: "TikTok", url: site.tiktok, Icon: TikTokIcon },
    { label: "Zalo", url: site.zalo, Icon: ZaloIcon },
  ].filter((s) => s.url); // mạng nào chưa có link (VD TikTok) → ẩn icon
  const columns = [
    {
      title: footer.shop,
      links: products.map((p) => ({ label: p.name, path: `/san-pham/${p.urlSlug}` })),
    },
    {
      title: footer.journal,
      links: articleCategories.map((c) => ({ label: c.label, path: "/song-dep", hash: c.id })),
    },
    {
      title: footer.policies,
      // urlSlug đã dịch theo ngôn ngữ (doi-tra / returns)
      links: policies.map((p) => ({ label: p.title, path: `/chinh-sach/${p.urlSlug}` })),
    },
  ];

  return (
    <footer className="bg-moss text-pearl">
      {/* ---------- Tầng 1: thương hiệu | link | liên hệ ---------- */}
      <Container
        wide
        className="grid grid-cols-2 gap-x-8 gap-y-10 pt-14 pb-12 md:grid-cols-6 xl:grid-cols-12 xl:gap-x-10"
      >
        <div className="reveal col-span-2 md:col-span-6 xl:col-span-3">
          <Logo href={href(lang, "/")} light className="h-10" />
          <p className="text-pearl/60 mt-5 max-w-md text-[13.5px] leading-relaxed">
            {footer.about}
          </p>
          {/* data-fab-avoid: nút "lên đầu trang" (góc trái dưới) tự ẩn khi hàng icon này đi qua → không che icon */}
          <ul className="mt-6 flex gap-2" aria-label={footer.follow} data-fab-avoid="">
            {socials.map(({ label, url, Icon }) => (
              <li key={label}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="border-pearl/20 hover:border-sage-300 hover:bg-sage-300 hover:text-forest grid size-9 place-items-center rounded-full border transition"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 3 cột link: rộng bằng nhau, tên dài tự xuống dòng (không kéo lệch cột) */}
        {columns.map((col, i) => (
          <nav
            key={col.title}
            aria-label={col.title}
            style={{ "--reveal-delay": `${(i + 1) * 80}ms` }}
            className={
              i === 2 ? "reveal col-span-2 sm:col-span-1 md:col-span-2" : "reveal md:col-span-2"
            }
          >
            <h2 className={heading}>{col.title}</h2>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.path + (l.hash ?? "")}>
                  <Link
                    href={href(lang, l.path) + (l.hash ? `#${l.hash}` : "")}
                    // py trên thẻ inline: nới vùng chạm (~30px) mà không đổi dòng chữ / khoảng cách
                    className="text-pearl/70 hover:text-pearl py-1.5 text-[13.5px] leading-snug transition"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Liên hệ: hotline nổi bật nhất (khách cần gọi ngay) */}
        <div
          style={{ "--reveal-delay": "320ms" }}
          className="reveal col-span-2 md:col-span-6 xl:col-span-3"
        >
          <h2 className={heading}>{footer.contact}</h2>
          <ul className="text-pearl/75 mt-5 grid gap-x-8 gap-y-4 text-[13.5px] md:grid-cols-[repeat(3,auto)] md:justify-between xl:grid-cols-1">
            <li className="flex gap-3">
              <Phone className={iconCls} aria-hidden="true" />
              <span>
                <a
                  href={`tel:${site.phoneRaw}`}
                  className="text-pearl hover:text-sage-300 block text-base leading-tight font-semibold tracking-wide whitespace-nowrap transition-colors"
                >
                  {site.phone}
                </a>
                <span className="text-pearl/50 text-xs">{footer.hotline}</span>
              </span>
            </li>
            <li className="flex min-w-0 gap-3">
              <Mail className={iconCls} aria-hidden="true" />
              <span className="min-w-0">
                <span className="text-pearl/50 block text-xs">Email</span>
                <a
                  href={`mailto:${site.company.email}`}
                  className="hover:text-sage-300 whitespace-nowrap transition-colors"
                >
                  {site.company.email}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className={iconCls} aria-hidden="true" />
              <span>
                <span className="text-pearl/50 block text-xs">{footer.hours}</span>
                <span className="whitespace-nowrap">{site.hours}</span>
              </span>
            </li>
          </ul>
          {/* Hỗ trợ sau khi mua: nút riêng cạnh hotline (không lẫn vào danh sách chính sách) */}
          <Link
            href={href(lang, "/tra-cuu-don-hang")}
            className="border-pearl/25 text-pearl hover:border-sage-300 hover:text-sage-300 mt-6 inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors"
          >
            <PackageSearch className="size-4 shrink-0" aria-hidden="true" />
            {footer.trackOrder}
          </Link>
        </div>
      </Container>

      {/* ---------- Tầng 2: doanh nghiệp | bản đồ ---------- */}
      <Container wide>
        <div className="border-pearl/10 grid items-center gap-8 border-t py-10 lg:grid-cols-12 lg:gap-12">
          <div className="reveal lg:col-span-5">
            <h2 className={heading}>{footer.company}</h2>
            <p className="text-pearl mt-4 flex gap-3 text-[14.5px] leading-snug font-semibold">
              <Building2 className={iconCls} aria-hidden="true" />
              {site.company.name}
            </p>
            <ul className="text-pearl/70 mt-3 space-y-2.5 text-[13.5px]">
              <li className="flex gap-3">
                <MapPin className={iconCls} aria-hidden="true" />
                {site.company.address}
              </li>
              <li className="flex gap-3">
                <Hash className={iconCls} aria-hidden="true" />
                {footer.taxId}: {site.company.taxId}
              </li>
            </ul>
            <a
              href={site.mapsDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="border-pearl/20 hover:border-sage-300 hover:bg-sage-300 hover:text-forest mt-6 inline-flex h-10 items-center gap-2 rounded-full border px-5 text-[11px] font-semibold tracking-[0.16em] uppercase transition"
            >
              <Navigation className="size-3.5" aria-hidden="true" /> {footer.directions}
            </a>
          </div>

          <MapEmbed
            src={site.mapsEmbed}
            title={`Google Maps — ${site.company.name}`}
            hint={footer.mapHint}
            className="reveal ring-pearl/10 aspect-[16/9] rounded-2xl ring-1 sm:aspect-[5/2] lg:col-span-7"
          />
        </div>
      </Container>

      {/* ---------- Dải đáy: chính hãng B.O.T + lưu ý + bản quyền ---------- */}
      <div className="border-pearl/10 border-t">
        {/* pb-24 trên điện thoại / px-24 ở màn vừa: chừa chỗ cho nút "lên đầu trang" & nút liên hệ nổi */}
        <Container
          wide
          // điện thoại: cả dải căn giữa (logo trên, chữ dưới); sm+: logo | chữ nằm ngang như cũ
          className="text-pearl/50 flex flex-col items-center gap-4 pt-6 pb-24 text-center text-[12px] leading-relaxed sm:items-start sm:pb-6 sm:text-left sm:max-2xl:px-24! lg:flex-row lg:items-center lg:justify-between lg:gap-12"
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Image
              src={brand.stackedWhite}
              alt="B.O.T"
              width={40}
              height={40}
              className="h-8 w-auto shrink-0 opacity-80"
            />
            <span className="bg-pearl/15 hidden h-8 w-px shrink-0 sm:block" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sage-300 text-[11px] font-semibold tracking-[0.18em] uppercase">
                {footer.certified}
              </p>
              <p className="mt-0.5 text-balance">{footer.disclaimer}</p>
            </div>
          </div>
          <p className="shrink-0">
            © {site.copyrightYear} {site.legalName}. {footer.rights}
          </p>
        </Container>
      </div>
    </footer>
  );
}
