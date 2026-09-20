import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tennis Club",
    short_name: "Tennis Club",
    start_url: "/profile",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#15803d",
    icons: [],
  };
}
