"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

export async function register(_: string | null, form: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Έλεγξε τα στοιχεία (κωδικός τουλάχιστον 8 χαρακτήρες).";
  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return "Το email χρησιμοποιείται ήδη.";
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });
  await createSession(user.id);
  redirect("/profile");
}

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function login(_: string | null, form: FormData) {
  const email = String(form.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  // Locked account: refuse without checking the password, so retries can't extend the lock
  // or keep guessing while it's active.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return `Πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά σε ${minutes} ${minutes === 1 ? "λεπτό" : "λεπτά"}.`;
  }

  const ok = user && (await bcrypt.compare(String(form.get("password") ?? ""), user.passwordHash));
  if (!user || !ok) {
    if (user) {
      const failedLogins = user.failedLogins + 1;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLogins,
          lockedUntil: failedLogins >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MS) : null,
        },
      });
    }
    return "Λάθος email ή κωδικός.";
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  }
  await createSession(user.id);
  redirect(user.role === "PLAYER" ? "/profile" : user.role === "COACH" ? "/coach/scan" : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
