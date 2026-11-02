"use client";

import { useState } from "react";
import { Ban, RotateCcw, X, Check } from "lucide-react";
import { Button, Field, Badge } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { cancelSession, uncancelSession } from "./actions";

export function CancelSession({
  sessionId,
  cancelledAt,
}: {
  sessionId: string;
  cancelledAt: Date | null;
  cancelReason: string | null;
}) {
  const [confirming, setConfirming] = useState(false);

  if (cancelledAt) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge tone="danger">Ακυρώθηκε</Badge>
        <ActionForm action={uncancelSession} success="Η ακύρωση αναιρέθηκε.">
          <input type="hidden" name="sessionId" value={sessionId} />
          <Button type="submit" variant="ghost" size="sm">
            <RotateCcw size={13} />
            Επαναφορά
          </Button>
        </ActionForm>
      </div>
    );
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="shrink-0 text-[var(--danger)]" onClick={() => setConfirming(true)}>
        <Ban size={13} />
        Ακύρωση
      </Button>
    );
  }

  return (
    <ActionForm
      action={cancelSession}
      success="Η προπόνηση ακυρώθηκε."
      onDone={() => setConfirming(false)}
      className="flex shrink-0 items-end gap-2"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="w-36">
        <Field name="reason" label="Λόγος (προαιρετικό)" required={false} placeholder="π.χ. κακοκαιρία" />
      </div>
      <Button type="submit" size="sm" variant="danger">
        <Check size={13} />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        <X size={13} />
      </Button>
    </ActionForm>
  );
}
