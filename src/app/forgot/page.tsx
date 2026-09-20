import Link from "next/link";
import { AuthForm } from "../auth-form";
import { requestReset } from "../reset-actions";
import { t } from "@/lib/el";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="mx-auto max-w-sm space-y-6 p-6 pt-16">
      <h1 className="text-2xl font-bold">Επαναφορά κωδικού</h1>
      {sent ? (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Αν υπάρχει λογαριασμός με αυτό το email, στείλαμε σύνδεσμο επαναφοράς. Έλεγξε και τα ανεπιθύμητα.
        </p>
      ) : (
        <AuthForm action={requestReset} submit="Αποστολή συνδέσμου" fields={[{ name: "email", label: t.email, type: "email" }]} />
      )}
      <p className="text-sm">
        <Link href="/login" className="text-green-700 underline">{t.login}</Link>
      </p>
    </main>
  );
}
