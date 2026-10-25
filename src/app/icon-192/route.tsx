import { ImageResponse } from "next/og";

// Served at /icon-192 and referenced from the PWA manifest (home-screen install icon).
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
          background: "#15803d",
          color: "white",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        TC
      </div>
    ),
    { width: 192, height: 192 },
  );
}
