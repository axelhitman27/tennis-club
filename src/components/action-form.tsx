"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useToast } from "./toast";

export type ActionResult = { ok: boolean; message?: string };

// Wraps a server action so submitting the form shows a toast once it settles —
// success message from the action (or the `success` fallback) on ok:true,
// the action's own message on ok:false. The action must always resolve to an
// ActionResult (never void), or an unchanged return value won't be seen as "new".
export function ActionForm({
  action,
  success,
  className,
  children,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  success: string;
  className?: string;
  children: ReactNode;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const seen = useRef(state);

  useEffect(() => {
    if (pending || state === seen.current) return;
    seen.current = state;
    if (!state) return;
    toast(state.ok ? state.message ?? success : state.message ?? "Κάτι πήγε στραβά.", state.ok ? "success" : "danger");
  }, [state, pending, success, toast]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
