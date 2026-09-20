"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

// Coach/admin confirms (or undoes) that a player handed over the cash.
export async function setChargePaid(chargeId: string, paid: boolean) {
  const staff = await requireUser(["COACH", "ADMIN"]);
  await db.charge.update({
    where: { id: chargeId },
    data: paid ? { paidAt: new Date(), paidById: staff.id } : { paidAt: null, paidById: null },
  });
  revalidatePath("/coach/players", "layout");
  revalidatePath("/profile");
}

export async function togglePaid(form: FormData) {
  await setChargePaid(String(form.get("chargeId")), form.get("paid") === "1");
}
