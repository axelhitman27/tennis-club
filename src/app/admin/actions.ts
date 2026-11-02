"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { parseCents } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { ensureUpcomingSessions } from "@/lib/schedule";

export type ActionResult = { ok: boolean; message?: string };

const sessionSchema = z.object({
  title: z.string().min(2),
  startsAt: z.string().min(1),
  location: z.string().optional(),
});

// One-off session (the recurring ones come from weekly slots).
export async function createSession(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const parsed = sessionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Συμπλήρωσε τίτλο και ημ/νία." };
  const p = parsed.data;
  await db.trainingSession.create({
    data: { title: p.title, startsAt: new Date(p.startsAt), location: p.location || null },
  });
  revalidatePath("/admin");
  return { ok: true, message: "Η προπόνηση προστέθηκε." };
}

const slotSchema = z.object({
  title: z.string().min(2),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().optional(),
});

export async function createSlot(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const parsed = slotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Έλεγξε τα στοιχεία του προγράμματος." };
  const p = parsed.data;
  await db.weeklySlot.create({ data: { ...p, location: p.location || null } });
  await ensureUpcomingSessions();
  revalidatePath("/admin");
  return { ok: true, message: "Το πρόγραμμα προστέθηκε." };
}

// Retires a slot: keeps history, drops future sessions nobody has attended yet.
export async function deleteSlot(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const slotId = String(form.get("slotId"));
  await db.weeklySlot.update({ where: { id: slotId }, data: { active: false } });
  await db.trainingSession.deleteMany({
    where: { slotId, startsAt: { gt: new Date() }, attendances: { none: {} } },
  });
  await db.playerSlot.deleteMany({ where: { slotId } });
  revalidatePath("/admin");
  return { ok: true, message: "Το πρόγραμμα αφαιρέθηκε." };
}

export async function updateSettings(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const monthly = parseCents(form.get("monthly"));
  const guest = parseCents(form.get("guest"));
  const weekly = Number(form.get("weekly"));
  if (monthly == null || guest == null || !Number.isInteger(weekly) || weekly < 1 || weekly > 7) {
    return { ok: false, message: "Έλεγξε τις τιμές και τον αριθμό προπονήσεων." };
  }
  await db.settings.upsert({
    where: { id: "club" },
    update: { monthlyCents: monthly, guestSessionCents: guest, weeklyTrainings: weekly },
    create: { id: "club", monthlyCents: monthly, guestSessionCents: guest, weeklyTrainings: weekly },
  });
  revalidatePath("/admin");
  return { ok: true, message: "Οι ρυθμίσεις αποθηκεύτηκαν." };
}

export async function setRole(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const admin = await requireUser(["ADMIN"]);
  const userId = String(form.get("userId"));
  const role = z.enum(["PLAYER", "COACH", "ADMIN"]).parse(form.get("role"));
  if (userId === admin.id) return { ok: false, message: "Δεν μπορείς να αλλάξεις τον δικό σου ρόλο." };
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
  return { ok: true, message: "Ο ρόλος ενημερώθηκε." };
}

const membershipSchema = z.object({
  userId: z.string(),
  months: z.coerce.number().int().min(1).max(24),
});

// Starts a membership now. Price per month defaults to the club price; a different
// value gives a deal (e.g. 3 months at 35 €). The whole period is one charge that the
// trainer marks paid when the cash arrives.
export async function createMembership(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const p = membershipSchema.parse(Object.fromEntries(form));
  const settings = await getSettings();
  const custom = String(form.get("monthlyPrice") ?? "").trim();
  const monthly = custom ? parseCents(custom) : settings.monthlyCents;
  if (monthly == null || monthly === 0) return { ok: false, message: "Έλεγξε την τιμή." };

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + p.months);

  const m = await db.membership.create({ data: { userId: p.userId, startsAt, endsAt } });
  await db.charge.create({
    data: {
      userId: p.userId,
      membershipId: m.id,
      amountCents: monthly * p.months,
      description: `Μηνιαία συνδρομή (${p.months} ${p.months === 1 ? "μήνας" : "μήνες"})`,
    },
  });
  revalidatePath(`/coach/players/${p.userId}`);
  return { ok: true, message: "Η συνδρομή ενεργοποιήθηκε." };
}
