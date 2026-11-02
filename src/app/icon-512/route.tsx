import { ImageResponse } from "next/og";
import { BRAND_COLOR, clubInitials } from "@/lib/branding";

export const dynamic = "force-dynamic";

// Served at /icon-512 and referenced from the PWA manifest (home-screen install icon).
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLOR,
          color: "white",
          fontSize: 232,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {clubInitials()}
      </div>
    ),
    { width: 512, height: 512 },
  );
}
