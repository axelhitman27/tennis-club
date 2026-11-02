"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, Users, Settings, LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { t } from "@/lib/el";
import { CLUB_NAME, clubInitials } from "@/lib/branding";
import { logout } from "./actions";

const links = [
  { href: "/coach/scan", label: t.scan, icon: QrCode },
  { href: "/coach/players", label: t.players, icon: Users },
] as const;

export function StaffNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <header
      className="sticky z-10 -mx-4 mb-5 border-b border-[var(--border)] bg-white/90 px-4 backdrop-blur"
      style={{ top: 0, paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <nav className="mx-auto flex max-w-3xl items-center gap-1 py-3">
        <div className="mr-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
            {clubInitials()}
          </div>
          <span className="hidden text-sm font-semibold text-[var(--ink)] sm:inline">{CLUB_NAME}</span>
        </div>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition " +
                (active ? "bg-[var(--brand-light)] text-[var(--brand-dark)]" : "text-[var(--muted)] hover:bg-stone-100")
              }
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
        {role === "ADMIN" && (
          <Link
            href="/admin"
            className={
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (pathname.startsWith("/admin") ? "bg-[var(--brand-light)] text-[var(--brand-dark)]" : "text-[var(--muted)] hover:bg-stone-100")
            }
          >
            <Settings size={16} />
            {t.admin}
          </Link>
        )}
        <form action={logout} className="ml-auto">
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)]">
            <LogOut size={16} />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </form>
      </nav>
    </header>
  );
}
