export type Bank = "RBC" | "TD" | "BMO" | "Scotiabank" | "CIBC";
export type Channel = "e-Transfer" | "RTR" | "Wire";
export type Status = "pending" | "held" | "released" | "escalated";
export type Decision = "hold" | "release" | "escalate";
export type Typology =
  | "Bank / CRA impersonation (safe account)"
  | "Investment / crypto scam"
  | "Romance scam"
  | "Invoice redirection (BEC)"
  | "Mule structuring under limit"
  | "Account takeover"
  | "Benign";

export interface Payment {
  id: string;
  bank: Bank;
  channel: Channel;
  amount: number;
  currency: "CAD";
  sender: { name: string; age: number; tenureYears: number; city: string };
  payee: { name: string; addedDaysAgo: number; email: string };
  memo: string;
  device: { isNew: boolean; label: string };
  velocity24h: number;
  hourLocal: number;
  splitsUnderLimit: number;
  status: Status;
  submittedAt: string;
}

export interface Signal {
  key: string;
  label: string;
  weight: number;
  detail: string;
}

export interface Verdict {
  score: number;
  band: "low" | "medium" | "high";
  typology: Typology;
  signals: Signal[];
  recommendation: Decision;
  headline: string;
  brief: string;
  callScript: string[];
  source: "rules" | "anthropic" | "groq" | "gemini";
}

export interface AuditEntry {
  id: string;
  time: string;
  analyst: string;
  paymentId: string;
  bank: Bank;
  amount: number;
  decision: Decision;
  score: number;
  source: Verdict["source"];
}
