import type { Bank } from "@/lib/types";

const styles: Record<Bank, string> = {
  RBC: "bg-blue-50 text-blue-800 border-blue-200",
  TD: "bg-emerald-50 text-emerald-800 border-emerald-200",
  BMO: "bg-sky-50 text-sky-800 border-sky-200",
  Scotiabank: "bg-red-50 text-red-800 border-red-200",
  CIBC: "bg-rose-50 text-rose-800 border-rose-200",
};

export function BankChip({ bank }: { bank: Bank }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${styles[bank]}`}>
      {bank}
    </span>
  );
}
