import type { Payment } from "@/lib/types";

export function MetricsStrip({ payments }: { payments: Payment[] }) {
  const pending = payments.filter((p) => p.status === "pending").length;
  const held = payments.filter((p) => p.status === "held");
  const released = payments.filter((p) => p.status === "released").length;
  const escalated = payments.filter((p) => p.status === "escalated").length;
  const protectedAmt = held.reduce((s, p) => s + p.amount, 0);
  const cells = [
    { label: "Pending", value: String(pending), tone: "" },
    { label: "Held", value: String(held.length), tone: "text-bad" },
    { label: "Escalated", value: String(escalated), tone: "text-warn" },
    { label: "Released", value: String(released), tone: "text-ok" },
  ];
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <div className="text-xs uppercase tracking-widest text-muted">This session</div>
      <div className="font-display mt-2 text-4xl font-bold text-ok">${protectedAmt.toLocaleString("en-CA")}</div>
      <div className="text-xs text-muted">stopped before settlement</div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-md bg-panel-2 px-2 py-2 text-center">
            <div className={`font-mono text-lg font-semibold ${c.tone}`}>{c.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted">{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
