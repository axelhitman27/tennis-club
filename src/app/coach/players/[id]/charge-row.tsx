"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { eur } from "@/lib/money";
import { t } from "@/lib/el";
import { togglePaid, updateCharge, deleteCharge } from "../../actions";

const fmtDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" });

export function ChargeRow({
  chargeId,
  description,
  amountCents,
  paid,
  createdAt,
}: {
  chargeId: string;
  description: string;
  amountCents: number;
  paid: boolean;
  createdAt: Date;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-col gap-2 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[var(--ink)]">{description}</p>
          <p className="text-xs text-[var(--muted)]">{fmtDate.format(createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-medium">{eur.format(amountCents / 100)}</span>
          <ActionForm action={togglePaid} success="Ενημερώθηκε.">
            <input type="hidden" name="chargeId" value={chargeId} />
            <input type="hidden" name="paid" value={paid ? "0" : "1"} />
            <Button type="submit" variant={paid ? "secondary" : "primary"} size="sm">
              {paid ? `✓ ${t.paid}` : t.markPaid}
            </Button>
          </ActionForm>
          <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)} aria-label="Επεξεργασία χρέωσης">
            <Pencil size={14} />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="rounded-xl border border-[var(--border)] bg-stone-50 p-3">
          <ActionForm
            action={updateCharge}
            success="Η χρέωση ενημερώθηκε."
            onDone={() => setEditing(false)}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="chargeId" value={chargeId} />
            <div className="w-24">
              <Field name="amount" label="€" defaultValue={(amountCents / 100).toString()} />
            </div>
            <div className="min-w-40 flex-1">
              <Field name="description" label="Περιγραφή" defaultValue={description} />
            </div>
            <Button type="submit" size="sm">
              <Check size={14} />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X size={14} />
            </Button>
          </ActionForm>
          <ActionForm action={deleteCharge} success="Η χρέωση διαγράφηκε." className="mt-2">
            <input type="hidden" name="chargeId" value={chargeId} />
            <Button type="submit" variant="ghost" size="sm" className="text-[var(--danger)]">
              <Trash2 size={14} />
              Διαγραφή χρέωσης
            </Button>
          </ActionForm>
        </div>
      )}
    </li>
  );
}
