import { Prisma } from "@prisma/client";
import { db } from "./db";
import { getSettings } from "./settings";

export type CheckinResult =
  | {
      ok: true;
      name: string;
      chargeId: string | null; // null when an active membership covers the training
      amountCents: number;
      outstandingCents: number; // total unpaid balance including this training
      expected: boolean | null; // declared this weekly slot? null for one-off sessions
    }
  | { ok: false; reason: "duplicate"; name: string; outstandingCents: number };

async function outstanding(tx: Prisma.TransactionClient, userId: string) {
  const r = await tx.charge.aggregate({ where: { userId, paidAt: null }, _sum: { amountCents: true } });
  return r._sum.amountCents ?? 0;
}

// Cash model: a check-in never fails. It records the attendance and, unless an active
// membership covers it, creates an unpaid guest-rate charge for the trainer to collect.
export async function checkIn(userId: string, sessionId: string): Promise<CheckinResult> {
  const settings = await getSettings();
  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const session = await tx.trainingSession.findUniqueOrThrow({ where: { id: sessionId } });

      const existing = await tx.attendance.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
      });
      if (existing) {
        return { ok: false, reason: "duplicate", name: user.name, outstandingCents: await outstanding(tx, userId) } as const;
      }

      const now = new Date();
      const membership = await tx.membership.findFirst({
        where: { userId, startsAt: { lte: now }, endsAt: { gt: now } },
      });
      const expected = session.slotId
        ? (await tx.playerSlot.count({ where: { userId, slotId: session.slotId } })) > 0
        : null;

      const attendance = await tx.attendance.create({ data: { sessionId, userId } });

      let chargeId: string | null = null;
      let amountCents = 0;
      if (!membership) {
        amountCents = settings.guestSessionCents;
        const charge = await tx.charge.create({
          data: {
            userId,
            amountCents,
            attendanceId: attendance.id,
            description: `Προπόνηση: ${session.title} (χωρίς συνδρομή)`,
          },
        });
        chargeId = charge.id;
      }
      return { ok: true, name: user.name, chargeId, amountCents, outstandingCents: await outstanding(tx, userId), expected } as const;
    });
  } catch (e) {
    // Two coaches scanning the same player at once: the unique constraint catches the second.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
      const r = await db.charge.aggregate({ where: { userId, paidAt: null }, _sum: { amountCents: true } });
      return { ok: false, reason: "duplicate", name: user.name, outstandingCents: r._sum.amountCents ?? 0 };
    }
    throw e;
  }
}
