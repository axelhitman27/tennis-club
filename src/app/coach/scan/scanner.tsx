"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, Circle, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
import { Select, Card, Button } from "@/components/ui";
import { setChargePaid } from "../actions";

type RosterEntry = { id: string; name: string; arrived: boolean; expected: boolean };
type Session = { id: string; label: string; roster: RosterEntry[] };
type Result =
  | { kind: "bad" }
  | { kind: "dup"; name: string; outstandingCents: number }
  | { kind: "ok"; name: string; chargeId: string | null; amountCents: number; outstandingCents: number; expected: boolean | null };

export function CheckinScanner({ sessions }: { sessions: Session[] }) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [paid, setPaid] = useState(false);
  const [pending, start] = useTransition();
  const busy = useRef(false);
  const router = useRouter();

  async function onScan(token: string) {
    if (busy.current || !sessionId) return;
    busy.current = true; // stays set until the coach dismisses the result
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, sessionId }),
      });
      const r = await res.json();
      setPaid(false);
      if (r.ok || r.reason === "duplicate") router.refresh(); // update the roster ticks
      if (r.ok) setResult({ kind: "ok", ...r });
      else if (r.reason === "duplicate") setResult({ kind: "dup", ...r });
      else setResult({ kind: "bad" });
    } catch {
      setResult({ kind: "bad" });
    }
  }

  function dismiss() {
    setResult(null);
    busy.current = false;
  }

  const roster = sessions.find((s) => s.id === sessionId)?.roster ?? [];
  const tone = !result ? "" : result.kind === "ok" ? "bg-[var(--success)]" : result.kind === "dup" ? "bg-[var(--warning)]" : "bg-[var(--danger)]";

  return (
    <div className="space-y-4">
      <Select label={t.chooseSession} value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>

      <Card className="relative overflow-hidden">
        <Scanner
          onScan={(codes) => codes[0] && onScan(codes[0].rawValue)}
          constraints={{ facingMode: "environment" }}
        />
        {result && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white ${tone}/95`}>
            {result.kind === "bad" && (
              <>
                <XCircle size={40} />
                <p className="text-xl font-bold">{t.checkinBadQr}</p>
              </>
            )}
            {result.kind === "dup" && (
              <>
                <AlertTriangle size={40} />
                <p className="text-xl font-bold">{t.checkinDup}</p>
                <p>{result.name}</p>
              </>
            )}
            {result.kind === "ok" && (
              <>
                <CheckCircle2 size={40} />
                <p className="text-sm opacity-90">{t.checkinOk}</p>
                <p className="text-2xl font-bold">{result.name}</p>
                {result.expected === false && (
                  <p className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 text-sm">
                    <AlertTriangle size={14} />
                    {t.offSchedule}
                  </p>
                )}
                <p className="text-lg">
                  {result.chargeId ? eur.format(result.amountCents / 100) : t.coveredByMembership}
                </p>
                {result.outstandingCents > result.amountCents && (
                  <p className="text-sm opacity-90">{t.balance}: {eur.format(result.outstandingCents / 100)}</p>
                )}
                {result.chargeId && (
                  <Button
                    variant="secondary"
                    disabled={pending || paid}
                    onClick={() => start(async () => { await setChargePaid(result.chargeId!, true); setPaid(true); })}
                  >
                    {paid && <CheckCircle2 size={16} />}
                    {paid ? t.paid : t.markPaid}
                  </Button>
                )}
              </>
            )}
            <Button variant="overlay" className="mt-2" onClick={dismiss}>
              <RotateCcw size={16} />
              {t.next}
            </Button>
          </div>
        )}
      </Card>

      {roster.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--ink)]">
            {t.expectedList} ({roster.filter((r) => r.arrived).length}/{roster.length})
          </h2>
          <ul className="space-y-1.5 text-sm">
            {roster.map((r) => (
              <li
                key={r.id}
                className={"flex items-center gap-2 " + (r.arrived ? "text-[var(--success)]" : "text-[var(--muted)]")}
              >
                {r.arrived ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {r.name}
                {!r.expected && <span className="text-[var(--warning)]">*</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
