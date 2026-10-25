import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tennis Club",
    short_name: "Tennis Club",
    start_url: "/profile",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#15803d",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
