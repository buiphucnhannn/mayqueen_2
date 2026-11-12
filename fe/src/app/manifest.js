import { siteConfig } from "@/config/site";
import { localize } from "@/i18n";

export default function manifest() {
  const site = localize(siteConfig, "vi");
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: site.themeColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
