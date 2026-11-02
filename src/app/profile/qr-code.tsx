"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Fetches a fresh short-lived token shortly before the previous one expires.
export function QrCode() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/qr", { cache: "no-store" });
        if (!res.ok) return;
        const { token, ttl } = await res.json();
        const url = await QRCode.toDataURL(token, {
          width: 280,
          margin: 1,
          color: { dark: "#1c1917", light: "#ffffff" },
        });
        if (cancelled) return;
        setSrc(url);
        timer = setTimeout(refresh, (ttl - 10) * 1000);
      } catch {
        timer = setTimeout(refresh, 5000);
      }
    }
    refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="mx-auto w-fit rounded-2xl border-2 border-[var(--brand-light)] bg-white p-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR" width={240} height={240} className="block" />
      ) : (
        <div className="h-[240px] w-[240px] animate-pulse rounded-lg bg-stone-100" />
      )}
    </div>
  );
}
