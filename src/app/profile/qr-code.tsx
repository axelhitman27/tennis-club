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
        const url = await QRCode.toDataURL(token, { width: 280, margin: 1 });
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

  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="QR" width={280} height={280} className="mx-auto" /> : <div className="mx-auto h-[280px] w-[280px] animate-pulse rounded bg-stone-200" />;
}
