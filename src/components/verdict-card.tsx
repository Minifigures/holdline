"use client";

import { BankChip } from "./bank-chip";
import { ScoreRing } from "./score-ring";
import { SettlementRail } from "./settlement-rail";
import type { Decision, Payment, Verdict } from "@/lib/types";

interface Props {
  payment: Payment;
  verdict: Verdict;
  loadingBrief: boolean;
  onDecide: (d: Decision) => void;
}

const bandLabel: Record<Verdict["band"], string> = { low: "Low risk", medium: "Needs review", high: "High risk" };
const bandStyle: Record<Verdict["band"], string> = {
  low: "border-ok/40 bg-ok/10 text-ok",
  medium: "border-warn/40 bg-warn/10 text-warn",
  high: "border-bad/40 bg-bad/10 text-bad",
};
const sourceLabel: Record<Verdict["source"], string> = {
  rules: "rules engine",
  anthropic: "model: Claude",
  groq: "model: Llama via Groq",
  gemini: "model: Gemini",
};

const bandBar: Record<Verdict["band"], string> = { low: "bg-ok", medium: "bg-warn", high: "bg-bad" };

export function VerdictCard({ payment: p, verdict: v, loadingBrief, onDecide }: Props) {
  const decided = p.status !== "pending";
  const total = v.signals.reduce((a, s) => a + s.weight, 0);
  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <div className="flex items-center gap-3">
          <BankChip bank={p.bank} />
          <span className="font-mono text-sm text-muted">{p.id}</span>
          <span className="text-xs text-muted">{p.channel} · submitted {new Date(p.submittedAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bandStyle[v.band]}`}>{bandLabel[v.band]}</span>
      </header>

      <SettlementRail status={p.status} channel={p.channel} paymentId={p.id} />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
        <div className="fade-up flex flex-col gap-5 md:flex-row" key={p.id}>
          <ScoreRing score={v.score} band={v.band} />
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest text-muted">Typology</div>
            <div className="font-display mt-1 text-xl font-bold">{v.typology}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted">From</dt><dd className="truncate">{p.sender.name}, {p.sender.age > 0 ? `${p.sender.age}, ` : ""}{p.sender.tenureYears}y client</dd>
              <dt className="text-muted">To</dt><dd className="truncate">{p.payee.name} <span className="text-muted">({p.payee.addedDaysAgo === 0 ? "added today" : `added ${p.payee.addedDaysAgo}d ago`})</span></dd>
              <dt className="text-muted">Amount</dt><dd className="font-mono">${p.amount.toLocaleString("en-CA")} CAD</dd>
              <dt className="text-muted">Device</dt><dd className={p.device.isNew ? "text-warn" : ""}>{p.device.label}</dd>
              <dt className="text-muted">Memo</dt><dd className="col-span-2 rounded bg-panel-2 px-2 py-1 font-mono text-xs">“{p.memo}”</dd>
            </dl>
          </div>
        </div>

        <div className={`mt-5 rounded-lg border p-4 ${bandStyle[v.band]}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-widest opacity-80">Analyst brief</div>
            <div className="text-[10px] font-mono opacity-80">{loadingBrief ? "writing brief…" : `source: ${sourceLabel[v.source]}`}</div>
          </div>
          <div className="font-display mt-1 text-lg font-bold text-foreground">{v.headline}</div>
          <p className={`mt-2 text-sm leading-relaxed text-foreground/90 ${loadingBrief ? "animate-pulse" : ""}`}>{v.brief}</p>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-widest text-muted">Signals</div>
          {v.signals.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No risk signals fired. Behaviour matches this client&apos;s baseline.</p>
          ) : (
            <>
              <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-panel-2" aria-hidden>
                {v.signals.map((s, i) => (
                  <div key={s.key} title={`${s.label} +${s.weight}`} style={{ width: `${(s.weight / Math.max(100, total)) * 100}%`, opacity: 1 - i * 0.12 }} className={`h-full ${bandBar[v.band]} border-r border-panel last:border-r-0`} />
                ))}
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {v.signals.map((s) => (
                  <li key={s.key} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 font-mono text-[11px] font-semibold text-muted">+{s.weight}</span>
                    <span><span className="font-medium">{s.label}</span><span className="block text-xs text-muted">{s.detail}</span></span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {v.callScript.length > 0 && (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-muted">Call script</div>
            <ol className="mt-2 space-y-2">
              {v.callScript.map((line, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-xs text-muted">{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
        <div className="text-xs text-muted">
          {decided ? (
            <span>Decision recorded: <span className="font-semibold uppercase text-foreground">{p.status}</span></span>
          ) : (
            <span>Recommended: <span className="font-semibold uppercase text-foreground">{v.recommendation}</span>. The analyst decides.</span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={decided} onClick={() => onDecide("release")} className="rounded-md border border-ok/40 bg-ok/10 px-3 py-1.5 text-sm font-semibold text-ok hover:bg-ok/20 disabled:cursor-not-allowed disabled:opacity-40">Release</button>
          <button type="button" disabled={decided} onClick={() => onDecide("escalate")} className="rounded-md border border-warn/40 bg-warn/10 px-3 py-1.5 text-sm font-semibold text-warn hover:bg-warn/20 disabled:cursor-not-allowed disabled:opacity-40">Escalate</button>
          <button type="button" disabled={decided} onClick={() => onDecide("hold")} className="rounded-md border border-bad/40 bg-bad px-3 py-1.5 text-sm font-semibold text-white hover:bg-bad/90 disabled:cursor-not-allowed disabled:opacity-40">Hold and call</button>
        </div>
      </footer>
    </section>
  );
}
