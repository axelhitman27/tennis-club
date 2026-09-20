import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Creates the first admin and default rules (40 €/month, 6 € per training without
// membership, 2 weekly trainings per player).
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Διαχειριστής", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  await db.settings.upsert({
    where: { id: "club" },
    update: {},
    create: { id: "club", monthlyCents: 4000, guestSessionCents: 600, weeklyTrainings: 2 },
  });
}

main().finally(() => db.$disconnect());
