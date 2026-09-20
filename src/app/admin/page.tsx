import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/money";
import { StaffNav } from "../staff-nav";
import { ensureUpcomingSessions, WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
import { createSession, createSlot, deleteSlot, updateSettings, setRole } from "./actions";

const fmtDateTime = new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" });
const input = "rounded-lg border border-stone-300 px-3 py-2";

export default async function AdminPage() {
  const admin = await requireUser(["ADMIN"]);
  await ensureUpcomingSessions();
  const [settings, sessions, users, unpaid, slots] = await Promise.all([
    getSettings(),
    db.trainingSession.findMany({
      orderBy: { startsAt: "desc" },
      take: 15,
      include: { _count: { select: { attendances: true } } },
    }),
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.charge.aggregate({ where: { paidAt: null }, _sum: { amountCents: true } }),
    db.weeklySlot.findMany({ where: { active: true }, include: { _count: { select: { players: true } } } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4">
      <StaffNav role={admin.role} />
      <p className="text-lg font-semibold">
        Συνολικές οφειλές: <span className="text-red-600">{eur.format((unpaid._sum.amountCents ?? 0) / 100)}</span>
      </p>

      <section className="space-y-3">
        <h2 className="font-semibold">Τιμές & κανόνες</h2>
        <form action={updateSettings} className="flex flex-wrap items-end gap-2 text-sm">
          <label>Μηνιαία συνδρομή (€)
            <input name="monthly" defaultValue={(settings.monthlyCents / 100).toString()} className={`${input} block w-28`} />
          </label>
          <label>Προπόνηση χωρίς συνδρομή (€)
            <input name="guest" defaultValue={(settings.guestSessionCents / 100).toString()} className={`${input} block w-28`} />
          </label>
          <label>Προπονήσεις / εβδομάδα
            <input name="weekly" type="number" min="1" max="7" defaultValue={settings.weeklyTrainings} className={`${input} block w-24`} />
          </label>
          <button className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">Αποθήκευση</button>
        </form>
        <p className="text-xs text-stone-500">
          Ισχύει για νέες χρεώσεις. Άλλη τιμή/μήνα (π.χ. 35 € για 3 μήνες) ορίζεται στη σελίδα του παίκτη.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Εβδομαδιαίο πρόγραμμα</h2>
        <form action={createSlot} className="flex flex-wrap items-end gap-2 text-sm">
          <input name="title" placeholder="Τίτλος" defaultValue="Προπόνηση" required className={input} />
          <select name="weekday" defaultValue="1" className={input}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{WEEKDAYS[d]}</option>)}
          </select>
          <input name="startTime" type="time" required className={input} />
          <input name="location" placeholder="Γήπεδο" className={input} />
          <button className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">Προσθήκη</button>
        </form>
        <ul className="divide-y rounded-2xl bg-white text-sm shadow-sm">
          {[...slots].sort(byWeekThenTime).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 p-3">
              <span>{WEEKDAYS[s.weekday]} {s.startTime} · {s.title}{s.location ? ` · ${s.location}` : ""} · {s._count.players} παίκτες</span>
              <form action={deleteSlot}>
                <input type="hidden" name="slotId" value={s.id} />
                <button className="text-red-600 underline">Διαγραφή</button>
              </form>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">Οι προπονήσεις δημιουργούνται αυτόματα για τις επόμενες 4 εβδομάδες.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Έκτακτη προπόνηση</h2>
        <form action={createSession} className="flex flex-wrap gap-2">
          <input name="title" placeholder="Τίτλος" required className={input} />
          <input name="startsAt" type="datetime-local" required className={input} />
          <input name="location" placeholder="Γήπεδο" className={input} />
          <button className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">Προσθήκη</button>
        </form>
        <ul className="text-sm">
          {sessions.map((s) => (
            <li key={s.id}>{fmtDateTime.format(s.startsAt)} · {s.title} · {s._count.attendances} παρουσίες</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Χρήστες ({users.length})</h2>
        <ul className="divide-y rounded-2xl bg-white shadow-sm">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              {u.role === "PLAYER"
                ? <Link href={`/coach/players/${u.id}`} className="text-green-800 underline">{u.name}</Link>
                : <span>{u.name}</span>}
              <form action={setRole} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <select name="role" defaultValue={u.role} disabled={u.id === admin.id} className="rounded border border-stone-300 px-2 py-1">
                  <option value="PLAYER">Παίκτης</option>
                  <option value="COACH">Προπονητής</option>
                  <option value="ADMIN">Διαχειριστής</option>
                </select>
                {u.id !== admin.id && <button className="text-green-800 underline">Αλλαγή</button>}
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
