import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { StaffNav } from "../../staff-nav";

export default async function PlayersPage() {
  const staff = await requireUser(["COACH", "ADMIN"]);
  const [players, owed] = await Promise.all([
    db.user.findMany({ where: { role: "PLAYER" }, orderBy: { name: "asc" } }),
    db.charge.groupBy({ by: ["userId"], where: { paidAt: null }, _sum: { amountCents: true } }),
  ]);
  const owedBy = new Map(owed.map((o) => [o.userId, o._sum.amountCents ?? 0]));
  const sorted = [...players].sort((a, b) => (owedBy.get(b.id) ?? 0) - (owedBy.get(a.id) ?? 0));

  return (
    <main className="mx-auto max-w-2xl p-4">
      <StaffNav role={staff.role} />
      <h1 className="mb-3 text-xl font-bold">{t.players}</h1>
      <ul className="divide-y rounded-2xl bg-white shadow-sm">
        {sorted.map((p) => {
          const due = owedBy.get(p.id) ?? 0;
          return (
            <li key={p.id}>
              <Link href={`/coach/players/${p.id}`} className="flex items-center justify-between p-4">
                <span>{p.name}</span>
                <span className={due > 0 ? "font-semibold text-red-600" : "text-stone-400"}>
                  {due > 0 ? eur.format(due / 100) : "—"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
