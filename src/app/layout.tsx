import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tennis Club",
  description: "Συνδρομές και παρουσίες για τον σύλλογο τένις",
  manifest: "/manifest.webmanifest",
  // Every page is behind login and shows personal data (names, payments, attendance),
  // so it has nothing to offer a search engine and shouldn't be indexed.
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#15803d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
