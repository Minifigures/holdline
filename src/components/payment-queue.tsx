"use client";

import { BankChip } from "./bank-chip";
import type { Payment, Status, Verdict } from "@/lib/types";

const dot: Record<Verdict["band"], string> = { low: "bg-ok", medium: "bg-warn", high: "bg-bad pulse-red" };
const statusStyle: Record<Status, string> = {
  pending: "text-muted border-line",
  held: "text-bad border-bad/40 bg-bad/10",
  released: "text-ok border-ok/40 bg-ok/10",
  escalated: "text-warn border-warn/40 bg-warn/10",
};

interface Props {
  payments: Payment[];
  scores: Record<string, Verdict>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PaymentQueue({ payments, scores, selectedId, onSelect }: Props) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Pre-send queue</h2>
        <span className="text-xs text-muted">{payments.filter((p) => p.status === "pending").length} awaiting review</span>
      </header>
      <ul className="scrollbar-thin flex-1 divide-y divide-line overflow-y-auto">
        {payments.map((p) => {
          const v = scores[p.id];
          const selected = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${selected ? "bg-panel-2" : "hover:bg-panel-2/60"}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${v ? dot[v.band] : "bg-line"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <BankChip bank={p.bank} />
                    <span className="truncate text-sm font-medium">{p.payee.name}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    <span className="font-mono">{p.channel}</span>
                    <span className="mx-1.5">·</span>
                    <span>from {p.sender.name}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm font-semibold">${p.amount.toLocaleString("en-CA")}</div>
                  <span className={`mt-0.5 inline-block rounded border px-1.5 py-px text-[10px] uppercase tracking-wide ${statusStyle[p.status]}`}>{p.status}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
