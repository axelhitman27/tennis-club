import Link from "next/link";
import { AuthForm } from "../auth-form";
import { register } from "../actions";
import { t } from "@/lib/el";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 p-6 pt-16">
      <h1 className="text-2xl font-bold">{t.register}</h1>
      <AuthForm
        action={register}
        submit={t.register}
        fields={[
          { name: "name", label: t.name },
          { name: "email", label: t.email, type: "email" },
          { name: "phone", label: t.phone, type: "tel", required: false },
          { name: "password", label: t.password, type: "password" },
        ]}
      />
      <p className="text-sm">
        <Link href="/login" className="text-green-700 underline">{t.login}</Link>
      </p>
    </main>
  );
}
