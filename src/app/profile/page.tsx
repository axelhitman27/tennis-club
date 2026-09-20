import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { ensureUpcomingSessions, WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
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
    <main className="mx-auto max-w-md space-y-6 p-4 pb-16">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <form action={logout}><button className="text-sm text-stone-500 underline">{t.logout}</button></form>
      </header>

      <section className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <QrCode />
        <p className="mt-3 font-medium">{t.showQr}</p>
        <p className="text-xs text-stone-500">{t.qrRefreshes}</p>
      </section>

      <section className="space-y-1 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{t.membership}</h2>
        {membership ? (
          <p>
            {t.monthlyMembership} · {t.validUntil} {fmtDate.format(membership.endsAt)}
          </p>
        ) : (
          <p className="text-stone-600">{t.noMembership}</p>
        )}
        <p className={`pt-1 font-semibold ${due > 0 ? "text-red-600" : "text-green-700"}`}>
          {due > 0 ? `${t.balance}: ${eur.format(due / 100)}` : t.allPaid}
        </p>
        <p className="text-xs text-stone-500">{t.cashNote}</p>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">{t.myDays}</h2>
          <p className="text-xs text-stone-500">{t.myDaysHelp} {settings.weeklyTrainings}).</p>
        </div>
        {slots.length === 0 && <p className="text-sm text-stone-500">—</p>}
        <div className="flex flex-wrap gap-2">
          {[...slots].sort(byWeekThenTime).map((s) => {
            const on = mine.has(s.id);
            return (
              <form key={s.id} action={toggleSlot}>
                <input type="hidden" name="slotId" value={s.id} />
                <button
                  disabled={!on && atLimit}
                  className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${on ? "border-green-700 bg-green-700 text-white" : "border-stone-300"}`}
                >
                  {WEEKDAYS[s.weekday]} {s.startTime}
                </button>
              </form>
            );
          })}
        </div>
        {upcoming.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium">{t.upcoming}</h3>
            <ul className="space-y-0.5 text-sm text-stone-700">
              {upcoming.map((u) => (
                <li key={u.id}>{fmtDateTime.format(u.startsAt)} · {u.title}{u.location ? ` · ${u.location}` : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold">{t.charges}</h2>
        <ul className="space-y-1 text-sm">
          {charges.map((c) => (
            <li key={c.id} className="flex justify-between gap-2">
              <span>{fmtDate.format(c.createdAt)} · {c.description}</span>
              <span className={c.paidAt ? "text-green-700" : "font-medium text-red-600"}>
                {eur.format(c.amountCents / 100)} {c.paidAt ? "✓" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold">{t.attendance}</h2>
        <ul className="space-y-1 text-sm">
          {attendances.map((a) => (
            <li key={a.id}>{fmtDateTime.format(a.session.startsAt)} · {a.session.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
