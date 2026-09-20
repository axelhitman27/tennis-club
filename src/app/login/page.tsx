import Link from "next/link";
import { AuthForm } from "../auth-form";
import { login } from "../actions";
import { t } from "@/lib/el";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return (
    <main className="mx-auto max-w-sm space-y-6 p-6 pt-16">
      <h1 className="text-2xl font-bold">{t.login}</h1>
      {reset && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">Ο κωδικός άλλαξε. Συνδέσου με τον νέο.</p>}
      <AuthForm
        action={login}
        submit={t.login}
        fields={[
          { name: "email", label: t.email, type: "email" },
          { name: "password", label: t.password, type: "password" },
        ]}
      />
      <p className="flex justify-between text-sm">
        <Link href="/register" className="text-green-700 underline">{t.register}</Link>
        <Link href="/forgot" className="text-stone-600 underline">Ξέχασες τον κωδικό;</Link>
      </p>
    </main>
  );
}
