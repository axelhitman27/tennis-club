"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type Tone = "success" | "danger" | "neutral";
type Toast = { id: number; tone: Tone; message: string };

const ToastCtx = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastCtx);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

const icon = { success: CheckCircle2, danger: XCircle, neutral: Info };
const tone = {
  success: "bg-[var(--success)]",
  danger: "bg-[var(--danger)]",
  neutral: "bg-[var(--ink)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, t: Tone = "success") => {
    const id = nextId.current++;
    setToasts((all) => [...all, { id, tone: t, message }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((item) => {
          const Icon = icon[item.tone];
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${tone[item.tone]}`}
            >
              <Icon size={16} className="shrink-0" />
              {item.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
