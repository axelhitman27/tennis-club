"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/session";

// A player declares (or drops) a weekly slot, up to the club's weekly limit.
export async function toggleSlot(form: FormData) {
  const user = await requireUser();
  const slotId = String(form.get("slotId"));
  const key = { userId_slotId: { userId: user.id, slotId } };

  if (await db.playerSlot.findUnique({ where: key })) {
    await db.playerSlot.delete({ where: key });
  } else {
    const [settings, count, slot] = await Promise.all([
      getSettings(),
      db.playerSlot.count({ where: { userId: user.id } }),
      db.weeklySlot.findFirst({ where: { id: slotId, active: true } }),
    ]);
    if (!slot || count >= settings.weeklyTrainings) return;
    await db.playerSlot.create({ data: { userId: user.id, slotId } });
  }
  revalidatePath("/profile");
}
