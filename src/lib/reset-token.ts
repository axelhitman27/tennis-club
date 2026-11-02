import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Creates a one-time link token for setting a password. Used by both the
// self-service "forgot password" flow and a coach/admin's invite for a new
// player — same mechanism, different TTL and email copy.
export async function createResetToken(userId: string, ttlMs: number) {
  const token = randomBytes(32).toString("hex");
  await db.passwordReset.create({
    data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

export function resetLink(token: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/reset/${token}`;
}

export async function findValidReset(token: string) {
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hash(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return null;
  return reset;
}
