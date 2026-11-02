import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CLUB_NAME, BRAND_COLOR } from "@/lib/branding";
import { ToastProvider } from "@/components/toast";

// Branding comes from env vars so a new club deployment needs only a different
// .env, never a code change. That only works if this is read per-request rather
// than baked in at build time (the Docker image is built before .env exists).
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: CLUB_NAME,
    description: `Συνδρομές και παρουσίες για τον σύλλογο — ${CLUB_NAME}`,
    manifest: "/manifest.webmanifest",
    // Every page is behind login and shows personal data (names, payments, attendance),
    // so it has nothing to offer a search engine and shouldn't be indexed.
    robots: { index: false, follow: false },
  };
}
export const viewport: Viewport = { themeColor: BRAND_COLOR };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head>
        {/* The whole app's accent color derives from this one variable (see globals.css). */}
        <style dangerouslySetInnerHTML={{ __html: `:root{--brand:${BRAND_COLOR}}` }} />
      </head>
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
