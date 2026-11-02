"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sendMail } from "@/lib/mail";
import { CLUB_NAME } from "@/lib/branding";
import { createResetToken, resetLink } from "@/lib/reset-token";
import { parseCents } from "@/lib/money";

export type ActionResult = { ok: boolean; message?: string };

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

export async function togglePaid(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const paid = form.get("paid") === "1";
  await setChargePaid(String(form.get("chargeId")), paid);
  return { ok: true, message: paid ? "Σημειώθηκε ως πληρωμένη." : "Σημειώθηκε ως απλήρωτη." };
}

// Corrects a charge the coach entered wrong (amount or description) — e.g. the
// wrong number of months, or a typo. Never used to resolve payment disputes
// silently: the amended amount is visible to the player on their own charges list.
export async function updateCharge(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["COACH", "ADMIN"]);
  const chargeId = String(form.get("chargeId"));
  const amountCents = parseCents(form.get("amount"));
  const description = String(form.get("description") ?? "").trim();
  if (amountCents == null || amountCents <= 0 || description.length < 2) {
    return { ok: false, message: "Έλεγξε το ποσό και την περιγραφή." };
  }
  const charge = await db.charge.update({ where: { id: chargeId }, data: { amountCents, description } });
  revalidatePath(`/coach/players/${charge.userId}`);
  revalidatePath("/coach/players", "layout");
  revalidatePath("/profile");
  return { ok: true, message: "Η χρέωση ενημερώθηκε." };
}

// Removes a charge entered by mistake entirely (e.g. charged the wrong player).
export async function deleteCharge(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireUser(["COACH", "ADMIN"]);
  const chargeId = String(form.get("chargeId"));
  const charge = await db.charge.delete({ where: { id: chargeId } });
  revalidatePath(`/coach/players/${charge.userId}`);
  revalidatePath("/coach/players", "layout");
  revalidatePath("/profile");
  return { ok: true, message: "Η χρέωση διαγράφηκε." };
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // a week — players don't always check email the same day

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type InviteResult = { error: string } | { link: string; name: string };

async function sendInvite(userId: string, name: string, email: string): Promise<InviteResult> {
  const token = await createResetToken(userId, INVITE_TTL_MS);
  const link = resetLink(token);
  // Not awaited, and the link is also handed back to the coach below: email may not be
  // configured yet, so the coach can still get the link to the player themselves.
  void sendMail(
    email,
    `Πρόσκληση — ${CLUB_NAME}`,
    `Γεια σου ${name},\n\nΟ προπονητής σε πρόσθεσε στο ${CLUB_NAME}. Όρισε τον κωδικό σου εδώ (ο σύνδεσμος ισχύει για 7 ημέρες):\n${link}\n\nΜετά θα μπορείς να συνδέεσαι και να δείχνεις το QR σου στις προπονήσεις.`,
  ).catch((e) => console.error("invite mail failed", e));
  return { link, name };
}

// A coach/admin creates the account directly, instead of the player self-registering.
// The password is a random value nobody knows; the player sets their own via the
// invite link below, which doubles as a fallback when email isn't configured.
export async function invitePlayer(_: InviteResult | null, form: FormData): Promise<InviteResult> {
  await requireUser(["COACH", "ADMIN"]);
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Έλεγξε το όνομα και το email." };

  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return { error: "Το email χρησιμοποιείται ήδη." };

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
      passwordSet: false,
    },
  });
  revalidatePath("/coach/players");
  return sendInvite(user.id, user.name, user.email);
}

export async function resendInvite(_: InviteResult | null, formOrId: FormData | string): Promise<InviteResult> {
  await requireUser(["COACH", "ADMIN"]);
  const userId = typeof formOrId === "string" ? formOrId : String(formOrId.get("userId"));
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  revalidatePath(`/coach/players/${userId}`);
  revalidatePath("/coach/players");
  return sendInvite(user.id, user.name, user.email);
}
