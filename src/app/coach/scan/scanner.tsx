"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { t } from "@/lib/el";
import { eur } from "@/lib/money";
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
  const tone = !result ? "" : result.kind === "ok" ? "bg-green-700" : result.kind === "dup" ? "bg-amber-600" : "bg-red-700";

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        {t.chooseSession}
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </label>
      <div className="relative overflow-hidden rounded-2xl">
        <Scanner
          onScan={(codes) => codes[0] && onScan(codes[0].rawValue)}
          constraints={{ facingMode: "environment" }}
        />
        {result && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white ${tone}/95`}>
            {result.kind === "bad" && <p className="text-xl font-bold">{t.checkinBadQr}</p>}
            {result.kind === "dup" && (
              <>
                <p className="text-xl font-bold">{t.checkinDup}</p>
                <p>{result.name}</p>
              </>
            )}
            {result.kind === "ok" && (
              <>
                <p className="text-sm">{t.checkinOk}</p>
                <p className="text-2xl font-bold">{result.name}</p>
                {result.expected === false && (
                  <p className="rounded bg-black/25 px-2 py-0.5 text-sm">⚠ {t.offSchedule}</p>
                )}
                <p className="text-lg">
                  {result.chargeId ? eur.format(result.amountCents / 100) : t.coveredByMembership}
                </p>
                {result.outstandingCents > result.amountCents && (
                  <p className="text-sm">{t.balance}: {eur.format(result.outstandingCents / 100)}</p>
                )}
                {result.chargeId && (
                  <button
                    disabled={pending || paid}
                    onClick={() => start(async () => { await setChargePaid(result.chargeId!, true); setPaid(true); })}
                    className="rounded-lg bg-white px-5 py-2 font-semibold text-green-800 disabled:opacity-70"
                  >
                    {paid ? `✓ ${t.paid}` : t.markPaid}
                  </button>
                )}
              </>
            )}
            <button onClick={dismiss} className="mt-2 rounded-lg border border-white/70 px-5 py-2">{t.next}</button>
          </div>
        )}
      </div>
      {roster.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold">
            {t.expectedList} ({roster.filter((r) => r.arrived).length}/{roster.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {roster.map((r) => (
              <li key={r.id} className={r.arrived ? "text-green-700" : "text-stone-700"}>
                {r.arrived ? "✓" : "○"} {r.name}{!r.expected && " *"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
