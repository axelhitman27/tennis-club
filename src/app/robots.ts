import type { MetadataRoute } from "next";

// Every page needs a login and shows players' personal data, so none of it belongs in a
// search index. The per-page `robots: { index: false }` in layout.tsx covers crawlers that
// read pages; this covers crawlers that only check /robots.txt first.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
