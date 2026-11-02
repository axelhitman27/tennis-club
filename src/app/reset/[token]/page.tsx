import { AuthForm } from "../../auth-form";
import { AuthShell } from "../../auth-shell";
import { resetPassword } from "../../reset-actions";
import { t } from "@/lib/el";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Όρισε κωδικό" subtitle="Τουλάχιστον 8 χαρακτήρες.">
      <AuthForm
        action={resetPassword.bind(null, token)}
        submit="Αποθήκευση"
        fields={[
          { name: "password", label: `Νέος ${t.password.toLowerCase()}`, type: "password" },
          { name: "confirm", label: "Επιβεβαίωση κωδικού", type: "password" },
        ]}
      />
    </AuthShell>
  );
}
