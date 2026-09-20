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

export async function login(_: string | null, form: FormData) {
  const email = String(form.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(String(form.get("password") ?? ""), user.passwordHash));
  if (!user || !ok) return "Λάθος email ή κωδικός.";
  await createSession(user.id);
  redirect(user.role === "PLAYER" ? "/profile" : user.role === "COACH" ? "/coach/scan" : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
