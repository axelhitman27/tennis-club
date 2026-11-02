import type { ReactNode } from "react";
import { CLUB_NAME, clubInitials } from "@/lib/branding";

// Shared centered-card layout for login/register/forgot/reset — the only screens
// shown before someone is signed in.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl font-bold text-white shadow-sm">
            {clubInitials()}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{CLUB_NAME}</p>
            <h1 className="text-xl font-bold text-[var(--ink)]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
