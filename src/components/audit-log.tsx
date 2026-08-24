import { BankChip } from "./bank-chip";
import type { AuditEntry } from "@/lib/types";

const tone: Record<AuditEntry["decision"], string> = { hold: "text-bad", release: "text-ok", escalate: "text-warn" };

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="shrink-0 text-sm font-semibold">Audit log</h2>
        <span className="truncate font-mono text-[10px] text-muted" title="Agent identity: holdline-triage-01, read-only scope">holdline-triage-01 · read-only</span>
      </header>
      {entries.length === 0 ? (
        <p className="p-4 text-sm text-muted">No decisions yet. Every hold, release and escalation is written here with the score and the brief&apos;s source.</p>
      ) : (
        <ul className="scrollbar-thin flex-1 divide-y divide-line overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="fade-up px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-muted">{e.time}</span>
                <span className={`font-semibold uppercase ${tone[e.decision]}`}>{e.decision}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <BankChip bank={e.bank} />
                <span className="font-mono">{e.paymentId}</span>
                <span className="font-mono">${e.amount.toLocaleString("en-CA")}</span>
                <span className="text-muted">score {e.score}</span>
              </div>
              <div className="mt-0.5 text-muted">by {e.analyst} · brief source: {e.source}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
