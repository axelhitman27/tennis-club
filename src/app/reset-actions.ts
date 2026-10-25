"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

const TTL_MS = 60 * 60 * 1000; // link valid for 1 hour
const COOLDOWN_MS = 60 * 1000; // at most one email per minute per account
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Always redirects to the same "sent" page so the form never reveals which emails have accounts.
export async function requestReset(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = email ? await db.user.findUnique({ where: { email } }) : null;

  if (user) {
    const recent = await db.passwordReset.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - COOLDOWN_MS) } },
    });
    if (!recent) {
      const token = randomBytes(32).toString("hex");
      await db.passwordReset.create({
        data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL_MS) },
      });
      const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset/${token}`;
      // Not awaited: keeps response time identical whether or not the account exists.
      void sendMail(
        user.email,
        "Επαναφορά κωδικού",
        `Γεια σου ${user.name},\n\nΓια να ορίσεις νέο κωδικό πάτησε τον σύνδεσμο (ισχύει για 1 ώρα):\n${link}\n\nΑν δεν το ζήτησες εσύ, αγνόησε αυτό το μήνυμα.`,
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

  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hash(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return "Ο σύνδεσμος δεν ισχύει πια. Ζήτησε νέο.";
  }

  const now = new Date();
  await db.$transaction([
    db.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        passwordChangedAt: now,
        failedLogins: 0,
        lockedUntil: null,
      },
    }),
    // Burn this link and any other outstanding ones.
    db.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: now } }),
  ]);
  redirect("/login?reset=1");
}
