import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";
import { Card, CardHeader, Badge, Button, Field, Avatar, EmptyState } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { StaffNav } from "../../../staff-nav";
import { createMembership } from "../../../admin/actions";
import { ResendInvite } from "./resend-invite";
import { ChargeRow } from "./charge-row";

const fmtDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" });

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireUser(["COACH", "ADMIN"]);
  const { id } = await params;
  const player = await db.user.findUnique({
    where: { id },
    include: {
      charges: { orderBy: { createdAt: "desc" }, take: 60 },
      memberships: { orderBy: { endsAt: "desc" }, take: 5 },
      slots: { include: { slot: true } },
    },
  });
  if (!player) notFound();

  const owed = player.charges.filter((c) => !c.paidAt).reduce((s, c) => s + c.amountCents, 0);
  const now = new Date();
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 pb-16">
      <StaffNav role={staff.role} />
      <Link href="/coach/players" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand)]">
        <ChevronLeft size={16} />
        {t.backToPlayers}
      </Link>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Avatar name={player.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--ink)]">{player.name}</h1>
              {!player.passwordSet && <Badge tone="warning">{t.invitePending}</Badge>}
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {player.email}
              </span>
              {player.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} />
                  {player.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={
            "mt-3 inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold " +
            (owed > 0 ? "bg-[var(--danger-light)] text-[var(--danger)]" : "bg-[var(--success-light)] text-[var(--success)]")
          }
        >
          {owed > 0 ? `${t.balance}: ${eur.format(owed / 100)}` : t.allPaid}
        </div>
        {!player.passwordSet && (
          <div className="mt-3">
            <ResendInvite userId={player.id} />
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={t.charges} />
        <div className="p-5">
          {player.charges.length === 0 ? (
            <EmptyState icon={<Receipt size={24} />} title={t.noChargesYet} />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {player.charges.map((c) => (
                <ChargeRow
                  key={c.id}
                  chargeId={c.id}
                  description={c.description}
                  amountCents={c.amountCents}
                  paid={!!c.paidAt}
                  createdAt={c.createdAt}
                />
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t.myDays} />
        <div className="flex flex-wrap gap-2 p-5">
          {player.slots.length === 0 ? (
            <span className="text-sm text-[var(--muted)]">—</span>
          ) : (
            player.slots
              .map((p) => p.slot)
              .sort(byWeekThenTime)
              .map((s) => (
                <Badge key={s.id} tone="brand">
                  {WEEKDAYS[s.weekday]} {s.startTime}
                </Badge>
              ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t.membership} />
        <div className="space-y-4 p-5">
          <ul className="space-y-1.5 text-sm">
            {player.memberships.length === 0 && <li className="text-[var(--muted)]">—</li>}
            {player.memberships.map((m) => {
              const active = m.startsAt <= now && m.endsAt > now;
              return (
                <li key={m.id} className="flex items-center gap-2">
                  {active && <Badge tone="success">{t.monthlyMembership}</Badge>}
                  <span className={active ? "font-medium text-[var(--ink)]" : "text-[var(--muted)]"}>
                    {fmtDate.format(m.startsAt)} – {fmtDate.format(m.endsAt)}
                  </span>
                </li>
              );
            })}
          </ul>
          {staff.role === "ADMIN" && (
            <ActionForm action={createMembership} success="Η συνδρομή ενεργοποιήθηκε." className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="userId" value={player.id} />
              <div className="w-24">
                <Field name="months" label="Μήνες" type="number" min={1} max={24} defaultValue="1" />
              </div>
              <div className="w-32">
                <Field name="monthlyPrice" label="€ / μήνα" required={false} placeholder={String(settings.monthlyCents / 100)} />
              </div>
              <Button type="submit">Ενεργοποίηση</Button>
            </ActionForm>
          )}
        </div>
      </Card>
    </main>
  );
}
