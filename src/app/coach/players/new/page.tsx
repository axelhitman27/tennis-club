import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { t } from "@/lib/el";
import { Card, PageHeader } from "@/components/ui";
import { StaffNav } from "../../../staff-nav";
import { InviteForm } from "./invite-form";

export default async function NewPlayerPage() {
  const staff = await requireUser(["COACH", "ADMIN"]);
  return (
    <main className="mx-auto max-w-lg px-4 pb-16">
      <StaffNav role={staff.role} />
      <Link href="/coach/players" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand)]">
        <ChevronLeft size={16} />
        {t.backToPlayers}
      </Link>
      <PageHeader title={t.addPlayer} subtitle={t.addPlayerHelp} />
      <Card className="mt-4 p-5">
        <InviteForm />
      </Card>
    </main>
  );
}
