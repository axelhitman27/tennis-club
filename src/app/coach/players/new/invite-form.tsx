"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { t } from "@/lib/el";
import { Button, Field, Alert } from "@/components/ui";
import { invitePlayer, type InviteResult } from "../../actions";

export function InviteForm() {
  const [result, formAction, pending] = useActionState<InviteResult | null, FormData>(invitePlayer, null);
  const [copied, setCopied] = useState(false);

  if (result && "link" in result) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          <span className="font-medium">
            {t.invited}: {result.name}
          </span>
        </Alert>
        <div>
          <p className="mb-2 text-sm text-[var(--muted)]">{t.inviteSentNote}</p>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-stone-50 p-3">
            <Mail size={16} className="shrink-0 text-[var(--muted)]" />
            <code className="flex-1 truncate text-xs">{result.link}</code>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(result.link).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t.copied : t.copyLink}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field name="name" label={t.name} />
      <Field name="email" label={t.email} type="email" />
      <Field name="phone" label={t.phone} required={false} />
      {result && "error" in result && <Alert tone="danger">{result.error}</Alert>}
      <Button type="submit" disabled={pending} full>
        {t.addPlayer}
      </Button>
    </form>
  );
}
