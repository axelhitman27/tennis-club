import Link from "next/link";
import { AuthForm } from "../auth-form";
import { AuthShell } from "../auth-shell";
import { register } from "../actions";
import { t } from "@/lib/el";

export default function RegisterPage() {
  return (
    <AuthShell title={t.createAccount}>
      <div className="space-y-4">
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
        <p className="text-center text-sm text-[var(--muted)]">
          {t.haveAccount}{" "}
          <Link href="/login" className="font-medium text-[var(--brand)]">
            {t.login}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
