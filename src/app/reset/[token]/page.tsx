import { AuthForm } from "../../auth-form";
import { resetPassword } from "../../reset-actions";
import { t } from "@/lib/el";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-sm space-y-6 p-6 pt-16">
      <h1 className="text-2xl font-bold">Νέος κωδικός</h1>
      <AuthForm
        action={resetPassword.bind(null, token)}
        submit="Αποθήκευση"
        fields={[
          { name: "password", label: `Νέος ${t.password.toLowerCase()}`, type: "password" },
          { name: "confirm", label: "Επιβεβαίωση κωδικού", type: "password" },
        ]}
      />
    </main>
  );
}
