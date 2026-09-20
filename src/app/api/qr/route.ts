import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";
import { signQrToken, QR_TTL_SECONDS } from "@/lib/qr";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ token: await signQrToken(user.id), ttl: QR_TTL_SECONDS });
}
