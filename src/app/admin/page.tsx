import Link from "next/link";
import { Wallet, Users, CalendarDays, Trash2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/money";
import { StaffNav } from "../staff-nav";
import { ensureUpcomingSessions, WEEKDAYS, byWeekThenTime } from "@/lib/schedule";
import { createSession, createSlot, deleteSlot, updateSettings, setRole } from "./actions";
import { Card, CardHeader, PageHeader, StatTile, Field, Select, Button, Badge, Avatar, EmptyState } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { CancelSession } from "./cancel-session";

const fmtDateTime = new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" });
const roleLabel = { PLAYER: "Παίκτης", COACH: "Προπονητής", ADMIN: "Διαχειριστής" } as const;

export default async function AdminPage() {
  const admin = await requireUser(["ADMIN"]);
  await ensureUpcomingSessions();
  const [settings, upcomingSessions, users, unpaid, slots, sessionCount] = await Promise.all([
    getSettings(),
    db.trainingSession.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 20,
      include: { _count: { select: { attendances: true } } },
    }),
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.charge.aggregate({ where: { paidAt: null }, _sum: { amountCents: true } }),
    db.weeklySlot.findMany({ where: { active: true }, include: { _count: { select: { players: true } } } }),
    db.trainingSession.count({ where: { startsAt: { gte: new Date() } } }),
  ]);
  const playerCount = users.filter((u) => u.role === "PLAYER").length;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
      <StaffNav role={admin.role} />
      <PageHeader title="Διαχείριση" />

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Wallet size={18} />}
          label="Οφειλές"
          value={eur.format((unpaid._sum.amountCents ?? 0) / 100)}
          tone={unpaid._sum.amountCents ? "danger" : "neutral"}
        />
        <StatTile icon={<Users size={18} />} label="Παίκτες" value={playerCount} />
        <StatTile icon={<CalendarDays size={18} />} label="Προσεχείς προπ." value={sessionCount} />
      </div>

      <Card>
        <CardHeader title="Τιμές & κανόνες" subtitle="Ισχύει για νέες χρεώσεις." />
        <ActionForm action={updateSettings} success="Οι ρυθμίσεις αποθηκεύτηκαν." className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          <Field name="monthly" label="Μηνιαία συνδρομή (€)" defaultValue={(settings.monthlyCents / 100).toString()} />
          <Field name="guest" label="Χωρίς συνδρομή (€)" defaultValue={(settings.guestSessionCents / 100).toString()} />
          <Field name="weekly" label="Προπ. / εβδομάδα" type="number" min={1} max={7} defaultValue={settings.weeklyTrainings} />
          <div className="col-span-2 sm:col-span-3">
            <Button type="submit">Αποθήκευση</Button>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Άλλη τιμή/μήνα (π.χ. 35 € για 3 μήνες) ορίζεται στη σελίδα κάθε παίκτη.
            </p>
          </div>
        </ActionForm>
      </Card>

      <Card>
        <CardHeader title="Εβδομαδιαίο πρόγραμμα" subtitle="Οι προπονήσεις δημιουργούνται αυτόματα για τις επόμενες 4 εβδομάδες." />
        <ActionForm action={createSlot} success="Το πρόγραμμα προστέθηκε." className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Field name="title" label="Τίτλος" defaultValue="Προπόνηση" />
          <Select name="weekday" label="Ημέρα" defaultValue="1">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <option key={d} value={d}>{WEEKDAYS[d]}</option>
            ))}
          </Select>
          <Field name="startTime" label="Ώρα" type="time" />
          <Field name="location" label="Γήπεδο" required={false} />
          <div className="col-span-2 sm:col-span-4">
            <Button type="submit" size="sm">
              <Plus size={14} />
              Προσθήκη
            </Button>
          </div>
        </ActionForm>
        <div className="border-t border-[var(--border)]">
          {slots.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Δεν υπάρχει πρόγραμμα ακόμα" />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {[...slots].sort(byWeekThenTime).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{WEEKDAYS[s.weekday]} {s.startTime}</Badge>
                    <span className="text-[var(--ink)]">{s.title}{s.location ? ` · ${s.location}` : ""}</span>
                    <span className="text-[var(--muted)]">· {s._count.players} παίκτες</span>
                  </div>
                  <ActionForm action={deleteSlot} success="Το πρόγραμμα αφαιρέθηκε.">
                    <input type="hidden" name="slotId" value={s.id} />
                    <Button variant="ghost" size="sm" className="text-[var(--danger)]">
                      <Trash2 size={14} />
                    </Button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Έκτακτη προπόνηση" />
        <ActionForm action={createSession} success="Η προπόνηση προστέθηκε." className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          <Field name="title" label="Τίτλος" />
          <Field name="startsAt" label="Ημ/νία & ώρα" type="datetime-local" />
          <Field name="location" label="Γήπεδο" required={false} />
          <div className="col-span-2 sm:col-span-3">
            <Button type="submit" size="sm">
              <Plus size={14} />
              Προσθήκη
            </Button>
          </div>
        </ActionForm>
      </Card>

      <Card>
        <CardHeader
          title="Προσεχείς προπονήσεις"
          subtitle="Ακύρωση ενημερώνει τους παίκτες με email και μέσα στην εφαρμογή."
        />
        <div className="border-t border-[var(--border)]">
          {upcomingSessions.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Καμία προσεχής προπόνηση" />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {upcomingSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0">
                    <p className={s.cancelledAt ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"}>
                      {s.title}{s.location ? ` · ${s.location}` : ""}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtDateTime.format(s.startsAt)} · {s._count.attendances} παρουσίες
                    </p>
                    {s.cancelledAt && s.cancelReason && (
                      <p className="text-xs text-[var(--danger)]">{s.cancelReason}</p>
                    )}
                  </div>
                  <CancelSession sessionId={s.id} cancelledAt={s.cancelledAt} cancelReason={s.cancelReason} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={`Χρήστες (${users.length})`} />
        <ul className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} />
                {u.role === "PLAYER" ? (
                  <Link href={`/coach/players/${u.id}`} className="font-medium text-[var(--brand)]">
                    {u.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--ink)]">{u.name}</span>
                )}
                <Badge tone="neutral">{roleLabel[u.role]}</Badge>
              </div>
              <ActionForm action={setRole} success="Ο ρόλος ενημερώθηκε." className="flex items-center gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <select
                  name="role"
                  defaultValue={u.role}
                  disabled={u.id === admin.id}
                  className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  <option value="PLAYER">Παίκτης</option>
                  <option value="COACH">Προπονητής</option>
                  <option value="ADMIN">Διαχειριστής</option>
                </select>
                {u.id !== admin.id && (
                  <Button variant="secondary" size="sm">
                    Αλλαγή
                  </Button>
                )}
              </ActionForm>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
