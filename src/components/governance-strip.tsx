const principles = [
  { title: "Human accountable", body: "The model never releases or holds a payment. An analyst clicks, and their name is on the log entry." },
  { title: "Least privilege", body: "The triage agent runs under its own identity with read-only scope over the pending queue. It cannot move money." },
  { title: "Logged activity", body: "Every score, brief source and decision is written to an append-only audit trail before settlement." },
];

export function GovernanceStrip() {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {principles.map((p) => (
        <div key={p.title} className="rounded-xl border border-line bg-panel px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">{p.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{p.body}</p>
        </div>
      ))}
      <p className="text-[11px] text-muted md:col-span-3">
        Designed around OSFI&apos;s 2026 expectations for AI and agent use at federally regulated financial institutions. Synthetic data only; bank names are used descriptively and no institution is affiliated with this project.
      </p>
    </section>
  );
}
