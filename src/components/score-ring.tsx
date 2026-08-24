import type { Verdict } from "@/lib/types";

const color: Record<Verdict["band"], string> = { low: "var(--ok)", medium: "var(--warn)", high: "var(--bad)" };

export function ScoreRing({ score, band }: { score: number; band: Verdict["band"] }) {
  const deg = Math.round((score / 100) * 360);
  return (
    <div
      className="relative grid h-28 w-28 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color[band]} ${deg}deg, var(--line) ${deg}deg)` }}
      aria-label={`Risk score ${score} of 100`}
    >
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-panel">
        <div className="text-center">
          <div className="font-mono text-3xl font-bold leading-none" style={{ color: color[band] }}>{score}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted">risk</div>
        </div>
      </div>
    </div>
  );
}
