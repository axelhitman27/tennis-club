import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { StaffNav } from "../../../staff-nav";
import { togglePaid } from "../../actions";
import { WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";
import { createMembership } from "../../../admin/actions";

const fmtDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" });
const input = "rounded-lg border border-stone-300 px-3 py-2";

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
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <StaffNav role={staff.role} />
      <Link href="/coach/players" className="text-sm text-green-700 underline">← {t.players}</Link>
      <header>
        <h1 className="text-xl font-bold">{player.name}</h1>
        <p className="text-sm text-stone-600">{player.email}{player.phone ? ` · ${player.phone}` : ""}</p>
        <p className={`mt-2 text-lg font-semibold ${owed > 0 ? "text-red-600" : "text-green-700"}`}>
          {owed > 0 ? `${t.balance}: ${eur.format(owed / 100)}` : t.allPaid}
        </p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">{t.charges}</h2>
        <ul className="divide-y">
          {player.charges.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p>{c.description}</p>
                <p className="text-xs text-stone-500">{fmtDate.format(c.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{eur.format(c.amountCents / 100)}</span>
                <form action={togglePaid}>
                  <input type="hidden" name="chargeId" value={c.id} />
                  <input type="hidden" name="paid" value={c.paidAt ? "0" : "1"} />
                  <button
                    className={c.paidAt
                      ? "rounded-lg border border-stone-300 px-3 py-1 text-stone-600"
                      : "rounded-lg bg-green-700 px-3 py-1 font-semibold text-white"}
                  >
                    {c.paidAt ? `✓ ${t.paid}` : t.markPaid}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">{t.myDays}</h2>
        <p className="text-sm">
          {player.slots.length === 0
            ? "—"
            : player.slots.map((p) => p.slot).sort(byWeekThenTime).map((s) => `${WEEKDAYS[s.weekday]} ${s.startTime}`).join(" · ")}
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">{t.membership}</h2>
        <ul className="mb-3 space-y-1 text-sm">
          {player.memberships.map((m) => (
            <li key={m.id} className={m.startsAt <= now && m.endsAt > now ? "font-medium text-green-800" : "text-stone-500"}>
              {t.monthlyMembership}
              {" · "}{fmtDate.format(m.startsAt)} – {fmtDate.format(m.endsAt)}
            </li>
          ))}
        </ul>
        {staff.role === "ADMIN" && (
          <form action={createMembership} className="flex flex-wrap items-end gap-2 text-sm">
            <input type="hidden" name="userId" value={player.id} />
            <label>Μήνες
              <input name="months" type="number" min="1" max="24" defaultValue="1" className={`${input} block w-20`} />
            </label>
            <label>€ / μήνα
              <input name="monthlyPrice" placeholder={String(settings.monthlyCents / 100)} className={`${input} block w-28`} />
            </label>
            <button className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">Ενεργοποίηση</button>
          </form>
        )}
      </section>
    </main>
  );
}
