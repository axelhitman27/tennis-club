import { ImageResponse } from "next/og";
import { BRAND_COLOR, clubInitials } from "@/lib/branding";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 80,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {clubInitials()}
      </div>
    ),
    { ...size },
  );
}
