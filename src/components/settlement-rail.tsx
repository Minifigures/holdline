import type { Channel, Status } from "@/lib/types";

interface Props {
  status: Status;
  channel: Channel;
  paymentId: string;
}

const endLabel: Record<Channel, string> = {
  RTR: "Irrevocable on the Real-Time Rail",
  "e-Transfer": "Auto-deposited, not recallable",
  Wire: "Sent to beneficiary bank",
};

export function SettlementRail({ status, channel, paymentId }: Props) {
  const stopped = status === "held" || status === "escalated";
  const released = status === "released";
  const dotColor = stopped ? "var(--bad)" : released ? "var(--ok)" : "var(--accent)";
  const dotClass = stopped ? "rail-dot rail-dot-paused" : released ? "" : "rail-dot";
  const dotStyle = stopped ? { left: "50%" } : released ? { left: "100%" } : undefined;

  return (
    <div className="px-5 pt-4" aria-label="Settlement rail">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted">
        <span>Submitted</span>
        <span className={stopped ? "text-bad" : ""}>Analyst gate</span>
        <span className={released ? "text-ok" : ""}>{endLabel[channel]}</span>
      </div>
      <div className="relative mt-1.5 h-4">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div className={`absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 ${stopped ? "bg-bad" : "bg-foreground/40"}`} />
        <div
          key={`${paymentId}-${status}`}
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${dotClass}`}
          style={{ background: dotColor, boxShadow: `0 0 0 3px color-mix(in srgb, ${dotColor} 20%, transparent)`, ...dotStyle }}
        />
      </div>
    </div>
  );
}
