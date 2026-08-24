"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuditLog } from "@/components/audit-log";
import { GovernanceStrip } from "@/components/governance-strip";
import { MetricsStrip } from "@/components/metrics-strip";
import { PaymentQueue } from "@/components/payment-queue";
import { VerdictCard } from "@/components/verdict-card";
import { payments as seed } from "@/lib/payments";
import { scorePayment } from "@/lib/rules";
import type { AuditEntry, Decision, Payment, Status, Verdict } from "@/lib/types";

const ANALYST = "M. Ayuste";
const statusFor: Record<Decision, Status> = { hold: "held", release: "released", escalate: "escalated" };

export default function Home() {
  const [payments, setPayments] = useState<Payment[]>(seed);
  const [selectedId, setSelectedId] = useState<string>(seed[0].id);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() =>
    Object.fromEntries(seed.map((p) => [p.id, scorePayment(p)])),
  );
  const [briefed, setBriefed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [provider, setProvider] = useState<Verdict["source"]>("rules");
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/triage")
      .then((r) => r.json())
      .then((j: { provider?: Verdict["source"] }) => j.provider && setProvider(j.provider))
      .catch(() => undefined);
  }, []);

  const fetchBrief = useCallback(
    async (id: string) => {
      if (briefed[id] || inflight.current.has(id)) return;
      inflight.current.add(id);
      setLoading(id);
      try {
        const res = await fetch("/api/triage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (res.ok) {
          const v = (await res.json()) as Verdict;
          setVerdicts((prev) => ({ ...prev, [id]: v }));
        }
      } catch {
        // rules verdict already in place
      } finally {
        inflight.current.delete(id);
        setBriefed((prev) => ({ ...prev, [id]: true }));
        setLoading((cur) => (cur === id ? null : cur));
      }
    },
    [briefed],
  );

  useEffect(() => {
    if (provider === "rules") return;
    const t = setTimeout(() => void fetchBrief(selectedId), 0);
    return () => clearTimeout(t);
  }, [selectedId, provider, fetchBrief]);

  const selected = useMemo(() => payments.find((p) => p.id === selectedId) ?? payments[0], [payments, selectedId]);
  const verdict = verdicts[selected.id];

  const decide = (d: Decision) => {
    const now = new Date();
    setPayments((prev) => prev.map((p) => (p.id === selected.id ? { ...p, status: statusFor[d] } : p)));
    setLog((prev) => [
      {
        id: `${selected.id}-${now.getTime()}`,
        time: now.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        analyst: ANALYST,
        paymentId: selected.id,
        bank: selected.bank,
        amount: selected.amount,
        decision: d,
        score: verdict.score,
        source: verdict.source,
      },
      ...prev,
    ]);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-bold text-white">H</div>
            <h1 className="font-display text-2xl font-bold">HoldLine</h1>
            <span className="hidden rounded-full border border-line px-2.5 py-0.5 text-xs text-muted sm:inline">Fraud ops · pre-send triage</span>
          </div>
          <p className="mt-1 text-sm text-muted">Human decides. AI explains. Every payment logged before it settles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-medium text-accent">Real-Time Rail rules in force · 24 Aug 2026</span>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-muted">brief: {provider === "rules" ? "rules engine" : provider}</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <div className="min-h-[420px] min-w-0 lg:h-[calc(100vh-230px)]">
          <PaymentQueue payments={payments} scores={verdicts} selectedId={selected.id} onSelect={setSelectedId} />
        </div>
        <div className="min-h-[560px] min-w-0 lg:h-[calc(100vh-230px)]">
          <VerdictCard payment={selected} verdict={verdict} loadingBrief={loading === selected.id} onDecide={decide} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:h-[calc(100vh-230px)]">
          <MetricsStrip payments={payments} />
          <AuditLog entries={log} />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { v: "$704M", k: "fraud losses reported to the Canadian Anti-Fraud Centre in 2025, a record" },
          { v: "1.4B+", k: "Interac e-Transfer transactions in 2024, $550B+ in value" },
          { v: "seconds", k: "to irrevocable settlement once a payment hits the Real-Time Rail" },
        ].map((s) => (
          <div key={s.v} className="rounded-xl border border-line bg-panel px-4 py-3">
            <div className="font-display text-2xl font-bold text-foreground">{s.v}</div>
            <div className="text-xs text-muted">{s.k}</div>
          </div>
        ))}
      </section>

      <GovernanceStrip />
    </main>
  );
}
