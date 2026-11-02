"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { t } from "@/lib/el";
import { Button, Alert } from "@/components/ui";
import { resendInvite, type InviteResult } from "../../actions";

export function ResendInvite({ userId }: { userId: string }) {
  const [result, formAction, pending] = useActionState<InviteResult | null, FormData>(
    (prev, form) => resendInvite(prev, form),
    null,
  );
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <Send size={14} />
          {t.resendInvite}
        </Button>
      </form>
      {result && "link" in result && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-stone-50 p-3">
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
      )}
      {result && "error" in result && <Alert tone="danger">{result.error}</Alert>}
    </div>
  );
}
