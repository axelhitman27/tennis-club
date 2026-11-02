"use client";

import { useActionState } from "react";
import { Button, Field, Alert } from "@/components/ui";

export function AuthForm({
  action,
  fields,
  submit,
}: {
  action: (s: string | null, f: FormData) => Promise<string | null>;
  fields: { name: string; label: string; type?: string; required?: boolean }[];
  submit: string;
}) {
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <Field key={f.name} name={f.name} label={f.label} type={f.type} required={f.required} />
      ))}
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" disabled={pending} full size="lg">
        {submit}
      </Button>
    </form>
  );
}
