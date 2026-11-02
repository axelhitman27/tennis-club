import { LogOut, CalendarDays, Wallet, History, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { ensureUpcomingSessions, WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
import { CLUB_NAME } from "@/lib/branding";
import { Card, CardHeader, Badge, EmptyState, Avatar } from "@/components/ui";
import { logout } from "../actions";
import { toggleSlot } from "./actions";
import { QrCode } from "./qr-code";

const fmtDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" });
const fmtDateTime = new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" });

export default async function ProfilePage() {
  const user = await requireUser();
  const now = new Date();
  await ensureUpcomingSessions();
  const [membership, charges, attendances, settings, slots, mySlots] = await Promise.all([
    db.membership.findFirst({
      where: { userId: user.id, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { endsAt: "desc" },
    }),
    db.charge.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.attendance.findMany({
      where: { userId: user.id },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      include: { session: true },
    }),
    getSettings(),
    db.weeklySlot.findMany({ where: { active: true } }),
    db.playerSlot.findMany({ where: { userId: user.id } }),
  ]);
  const mine = new Set(mySlots.map((s) => s.slotId));
  const atLimit = mine.size >= settings.weeklyTrainings;
  const upcoming = await db.trainingSession.findMany({
    where: { startsAt: { gt: now }, slotId: { in: [...mine] } },
    orderBy: { startsAt: "asc" },
    take: 4,
  });
  const owed = await db.charge.aggregate({ where: { userId: user.id, paidAt: null }, _sum: { amountCents: true } });
  const due = owed._sum.amountCents ?? 0;

  return (
    <main className="mx-auto max-w-md pb-16">
      <header
        className="mb-5 flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div>
            <p className="text-sm font-semibold leading-tight text-[var(--ink)]">{user.name}</p>
            <p className="text-xs text-[var(--muted)]">{CLUB_NAME}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="rounded-lg p-2 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)]" aria-label={t.logout}>
            <LogOut size={18} />
          </button>
        </form>
      </header>

      <div className="space-y-4 px-4">
        <Card className="p-5 text-center">
          <QrCode />
          <p className="mt-4 font-medium text-[var(--ink)]">{t.showQr}</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" />
            {t.qrRefreshes}
          </p>
        </Card>

        <Card>
          <CardHeader
            title={t.membership}
            action={
              membership ? (
                <Badge tone="success">{t.monthlyMembership}</Badge>
              ) : (
                <Badge tone="neutral">{t.noMembershipBadge}</Badge>
              )
            }
          />
          <div className="space-y-3 p-5">
            {membership ? (
              <p className="text-sm text-[var(--ink)]">
                {t.validUntil} <span className="font-medium">{fmtDate.format(membership.endsAt)}</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--muted)]">{t.noMembership}</p>
            )}
            <div
              className={
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold " +
                (due > 0 ? "bg-[var(--danger-light)] text-[var(--danger)]" : "bg-[var(--success-light)] text-[var(--success)]")
              }
            >
              <Wallet size={16} />
              {due > 0 ? `${t.balance}: ${eur.format(due / 100)}` : t.allPaid}
            </div>
            <p className="text-xs text-[var(--muted)]">{t.cashNote}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title={t.myDays} subtitle={`${t.myDaysHelp} ${settings.weeklyTrainings}).`} />
          <div className="space-y-4 p-5">
            {slots.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">—</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[...slots].sort(byWeekThenTime).map((s) => {
                  const on = mine.has(s.id);
                  return (
                    <form key={s.id} action={toggleSlot}>
                      <input type="hidden" name="slotId" value={s.id} />
                      <button
                        disabled={!on && atLimit}
                        className={
                          "rounded-xl border px-3.5 py-2 text-sm font-medium transition disabled:opacity-40 " +
                          (on
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-[var(--border)] bg-white text-[var(--ink)] hover:border-[var(--brand)]")
                        }
                      >
                        {WEEKDAYS[s.weekday]} {s.startTime}
                      </button>
                    </form>
                  );
                })}
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <CalendarDays size={14} />
                  {t.upcoming}
                </h3>
                <ul className="space-y-1 text-sm text-[var(--ink)]">
                  {upcoming.map((u) => (
                    <li key={u.id} className="flex justify-between">
                      <span>{u.title}{u.location ? ` · ${u.location}` : ""}</span>
                      <span className="text-[var(--muted)]">{fmtDateTime.format(u.startsAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t.charges} />
          <div className="p-5">
            {charges.length === 0 ? (
              <EmptyState icon={<Receipt size={24} />} title={t.noChargesYet} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {charges.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <p className="text-[var(--ink)]">{c.description}</p>
                      <p className="text-xs text-[var(--muted)]">{fmtDate.format(c.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eur.format(c.amountCents / 100)}</span>
                      <Badge tone={c.paidAt ? "success" : "danger"}>{c.paidAt ? t.paid : t.unpaid}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t.attendance} />
          <div className="p-5">
            {attendances.length === 0 ? (
              <EmptyState icon={<History size={24} />} title={t.noAttendanceYet} />
            ) : (
              <ul className="space-y-2 text-sm">
                {attendances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-[var(--ink)]">
                    <span>{a.session.title}</span>
                    <span className="text-[var(--muted)]">{fmtDateTime.format(a.session.startsAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
