import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensureUpcomingSessions } from "@/lib/schedule";
import { StaffNav } from "../../staff-nav";
import { CheckinScanner } from "./scanner";

const fmt = new Intl.DateTimeFormat("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });

export default async function ScanPage() {
  const staff = await requireUser(["COACH", "ADMIN"]);
  await ensureUpcomingSessions();
  const now = new Date();
  const sessions = await db.trainingSession.findMany({
    where: {
      startsAt: {
        gte: new Date(now.getTime() - 6 * 3600e3),
        lte: new Date(now.getTime() + 24 * 3600e3),
      },
    },
    orderBy: { startsAt: "asc" },
    include: {
      attendances: { include: { user: true } },
      slot: { include: { players: { include: { user: true } } } },
    },
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <StaffNav role={staff.role} />
      <CheckinScanner
        sessions={sessions.map((s) => {
          const arrived = new Set(s.attendances.map((a) => a.userId));
          const expected = (s.slot?.players ?? []).map((p) => ({
            id: p.userId,
            name: p.user.name,
            arrived: arrived.has(p.userId),
            expected: true,
          }));
          const expectedIds = new Set(expected.map((e) => e.id));
          const extras = s.attendances
            .filter((a) => !expectedIds.has(a.userId))
            .map((a) => ({ id: a.userId, name: a.user.name, arrived: true, expected: false }));
          return {
            id: s.id,
            label: `${fmt.format(s.startsAt)} · ${s.title}`,
            roster: [...expected, ...extras].sort((a, b) => a.name.localeCompare(b.name, "el")),
          };
        })}
      />
    </main>
  );
}
