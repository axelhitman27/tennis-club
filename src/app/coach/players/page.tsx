import Link from "next/link";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { Card, PageHeader, LinkButton, Badge, Avatar, EmptyState } from "@/components/ui";
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
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <StaffNav role={staff.role} />
      <PageHeader
        title={t.players}
        subtitle={`${players.length}`}
        action={
          <LinkButton href="/coach/players/new" size="sm">
            <UserPlus size={16} />
            {t.addPlayer}
          </LinkButton>
        }
      />
      <Card className="mt-4">
        {sorted.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<Users size={24} />} title={t.noPlayersYet} />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {sorted.map((p) => {
              const due = owedBy.get(p.id) ?? 0;
              return (
                <li key={p.id}>
                  <Link href={`/coach/players/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-stone-50">
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--ink)]">{p.name}</p>
                      {!p.passwordSet && <Badge tone="warning">{t.invitePending}</Badge>}
                    </div>
                    {due > 0 && <span className="font-semibold text-[var(--danger)]">{eur.format(due / 100)}</span>}
                    <ChevronRight size={18} className="text-[var(--muted)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
