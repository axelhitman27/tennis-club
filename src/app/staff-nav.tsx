import Link from "next/link";
import type { Role } from "@prisma/client";
import { t } from "@/lib/el";
import { logout } from "./actions";

export function StaffNav({ role }: { role: Role }) {
  return (
    <nav className="mb-4 flex items-center gap-4 border-b border-stone-200 pb-3 text-sm">
      <Link href="/coach/scan" className="font-medium text-green-800">{t.scan}</Link>
      <Link href="/coach/players" className="font-medium text-green-800">{t.players}</Link>
      {role === "ADMIN" && <Link href="/admin" className="font-medium text-green-800">{t.admin}</Link>}
      <form action={logout} className="ml-auto"><button className="text-stone-500 underline">{t.logout}</button></form>
    </nav>
  );
}
