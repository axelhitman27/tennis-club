import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/session";
import { verifyQrToken } from "@/lib/qr";
import { checkIn } from "@/lib/checkin";

const body = z.object({ token: z.string(), sessionId: z.string() });

export async function POST(req: Request) {
  const staff = await getUser();
  if (!staff || staff.role === "PLAYER") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const userId = await verifyQrToken(parsed.data.token);
  if (!userId) return NextResponse.json({ ok: false, reason: "bad_qr" });

  return NextResponse.json(await checkIn(userId, parsed.data.sessionId));
}
