import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "./db";

const COOKIE = "session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    // A password reset logs out every session issued before it.
    if (user?.passwordChangedAt && (payload.iat ?? 0) * 1000 < user.passwordChangedAt.getTime()) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/profile");
  return user;
}
