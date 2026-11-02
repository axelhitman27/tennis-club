import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthForm } from "../auth-form";
import { AuthShell } from "../auth-shell";
import { requestReset } from "../reset-actions";
import { t } from "@/lib/el";
import { EmptyState } from "@/components/ui";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <AuthShell title="Επαναφορά κωδικού">
      <div className="space-y-4">
        {sent ? (
          <EmptyState
            icon={<Mail className="text-[var(--brand)]" size={28} />}
            title="Ο σύνδεσμος στάλθηκε"
            subtitle="Αν υπάρχει λογαριασμός με αυτό το email, θα λάβεις σύνδεσμο επαναφοράς. Έλεγξε και τα ανεπιθύμητα."
          />
        ) : (
          <AuthForm
            action={requestReset}
            submit="Αποστολή συνδέσμου"
            fields={[{ name: "email", label: t.email, type: "email" }]}
          />
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--brand)]">
            {t.login}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
