import Link from "next/link";
import { AuthForm } from "../auth-form";
import { AuthShell } from "../auth-shell";
import { login } from "../actions";
import { t } from "@/lib/el";
import { Alert } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return (
    <AuthShell title={t.welcomeBack}>
      <div className="space-y-4">
        {reset && <Alert tone="success">Ο κωδικός άλλαξε. Συνδέσου με τον νέο.</Alert>}
        <AuthForm
          action={login}
          submit={t.login}
          fields={[
            { name: "email", label: t.email, type: "email" },
            { name: "password", label: t.password, type: "password" },
          ]}
        />
        <div className="flex justify-between text-sm">
          <Link href="/register" className="font-medium text-[var(--brand)]">
            {t.noAccount}
          </Link>
          <Link href="/forgot" className="text-[var(--muted)]">
            {t.forgotPassword}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
