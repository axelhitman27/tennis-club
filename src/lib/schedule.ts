import { db } from "./db";

// Sunday-first, matching Date.getDay().
export const WEEKDAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

// Monday-first ordering for display.
export const byWeekThenTime = (a: { weekday: number; startTime: string }, b: { weekday: number; startTime: string }) =>
  (a.weekday + 6) % 7 - (b.weekday + 6) % 7 || a.startTime.localeCompare(b.startTime);

// Materialises the next few weeks of sessions from the active weekly slots.
// Idempotent (unique on slotId+startsAt), so it is safe to call on every page load.
// Times are built in the server's local zone, which the deployment pins to Europe/Athens.
export async function ensureUpcomingSessions(weeks = 4) {
  const slots = await db.weeklySlot.findMany({ where: { active: true } });
  if (slots.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    for (const s of slots) {
      if (s.weekday !== day.getDay()) continue;
      const [h, m] = s.startTime.split(":").map(Number);
      const startsAt = new Date(day);
      startsAt.setHours(h, m, 0, 0);
      data.push({ title: s.title, startsAt, location: s.location, slotId: s.id });
    }
  }
  await db.trainingSession.createMany({ data, skipDuplicates: true });
}
