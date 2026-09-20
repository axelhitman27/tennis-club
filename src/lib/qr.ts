import { SignJWT, jwtVerify } from "jose";

// Short-lived so a screenshot of the QR is useless a minute later.
export const QR_TTL_SECONDS = 60;
const key = () => new TextEncoder().encode(process.env.QR_SECRET!);

export async function signQrToken(userId: string) {
  return new SignJWT({ typ: "checkin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${QR_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifyQrToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.typ === "checkin" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
