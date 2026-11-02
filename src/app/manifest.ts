import type { MetadataRoute } from "next";
import { CLUB_NAME, BRAND_COLOR } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: CLUB_NAME,
    short_name: CLUB_NAME,
    start_url: "/profile",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: BRAND_COLOR,
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
