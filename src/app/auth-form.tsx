"use client";

import { useActionState } from "react";

const input = "w-full rounded-lg border border-stone-300 px-3 py-2";

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
        <label key={f.name} className="block text-sm font-medium">
          {f.label}
          <input name={f.name} type={f.type ?? "text"} required={f.required ?? true} className={input} />
        </label>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-green-700 py-2 font-semibold text-white disabled:opacity-60">
        {submit}
      </button>
    </form>
  );
}
