"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { CLUB_NAME } from "@/lib/branding";
import { createResetToken, resetLink, findValidReset } from "@/lib/reset-token";

const FORGOT_TTL_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_MS = 60 * 1000; // at most one email per minute per account

// Always redirects to the same "sent" page so the form never reveals which emails have accounts.
export async function requestReset(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = email ? await db.user.findUnique({ where: { email } }) : null;

  if (user) {
    const recent = await db.passwordReset.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - COOLDOWN_MS) } },
    });
    if (!recent) {
      const token = await createResetToken(user.id, FORGOT_TTL_MS);
      // Not awaited: keeps response time identical whether or not the account exists.
      void sendMail(
        user.email,
        "Επαναφορά κωδικού",
        `Γεια σου ${user.name},\n\nΓια να ορίσεις νέο κωδικό πάτησε τον σύνδεσμο (ισχύει για 1 ώρα):\n${resetLink(token)}\n\nΑν δεν το ζήτησες εσύ, αγνόησε αυτό το μήνυμα.\n\n${CLUB_NAME}`,
      ).catch((e) => console.error("reset mail failed", e));
    }
  }
  redirect("/forgot?sent=1");
}

const resetSchema = z
  .object({ password: z.string().min(8), confirm: z.string() })
  .refine((v) => v.password === v.confirm);

export async function resetPassword(token: string, _: string | null, form: FormData) {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Οι κωδικοί πρέπει να ταιριάζουν (τουλάχιστον 8 χαρακτήρες).";

  const reset = await findValidReset(token);
  if (!reset) return "Ο σύνδεσμος δεν ισχύει πια. Ζήτησε νέο.";

  const now = new Date();
  await db.$transaction([
    db.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        passwordChangedAt: now,
        passwordSet: true,
        failedLogins: 0,
        lockedUntil: null,
      },
    }),
    // Burn this link and any other outstanding ones.
    db.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: now } }),
  ]);
  redirect("/login?reset=1");
}
