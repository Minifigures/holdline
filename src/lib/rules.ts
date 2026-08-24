import type { Decision, Payment, Signal, Typology, Verdict } from "./types";

const URGENCY = /\b(urgent|urgently|today|now|immediately|asap|right away|deadline)\b/i;
const IMPERSONATION = /\b(cra|revenue agency|safe account|security officer|fraud (dept|team|department)|bank (said|officer|security)|protect (your )?funds|investigator)\b/i;
const INVESTMENT = /\b(guaranteed|\d+% (weekly|daily|monthly)|crypto|bitcoin|usdt|yield|advisor|trading)\b/i;
const ROMANCE = /\b(love you|flight home|miss you|my dear|visa fee|customs)\b/i;
const INVOICE = /\b(invoice|updated banking details|new account|per email|remittance)\b/i;
const FRACTION = /^\s*\d\s*\/\s*\d\s*$/;

export function scorePayment(p: Payment): Verdict {
  const signals: Signal[] = [];
  const add = (key: string, label: string, weight: number, detail: string) =>
    signals.push({ key, label, weight, detail });

  if (p.payee.addedDaysAgo <= 7) {
    add("new-payee", "New payee", 30, `Payee added ${p.payee.addedDaysAgo === 0 ? "today" : `${p.payee.addedDaysAgo}d ago`} (${p.payee.email})`);
  }
  if (p.amount >= 5000) {
    add("large-amount", "Large amount", 15, `$${p.amount.toLocaleString("en-CA")} is above the $5,000 review threshold`);
  }
  if (URGENCY.test(p.memo)) {
    add("urgency", "Urgency language", 20, `Memo pressures immediate action: "${p.memo}"`);
  }
  if (IMPERSONATION.test(p.memo) || IMPERSONATION.test(p.payee.name)) {
    add("impersonation", "Bank / CRA / safe-account phrasing", 30, "Memo or payee mimics a bank, CRA or fraud department. No institution asks clients to move money to a safe account.");
  }
  if (p.device.isNew) {
    add("new-device", "New device", 15, p.device.label);
  }
  if (p.velocity24h >= 3) {
    add("velocity", "High velocity", 10, `${p.velocity24h} outbound payments in 24h`);
  }
  if (p.hourLocal < 6 || p.hourLocal >= 23) {
    add("off-hours", "Off-hours", 5, `Submitted at ${String(p.hourLocal).padStart(2, "0")}:00 local`);
  }
  if (p.splitsUnderLimit >= 3 || FRACTION.test(p.memo)) {
    add("structuring", "Split under limit", 20, `${p.splitsUnderLimit} transfers just under the daily limit${FRACTION.test(p.memo) ? `, memo "${p.memo}" reads like a sequence` : ""}`);
  }
  if (p.sender.age >= 65 && signals.length >= 2) {
    add("vulnerable", "Vulnerable client", 10, `${p.sender.age}-year-old client, ${p.sender.tenureYears}y tenure, atypical pattern`);
  }
  if (INVESTMENT.test(p.memo) && p.payee.addedDaysAgo <= 30) {
    add("investment", "Too-good-to-be-true return", 20, "Guaranteed or weekly returns are a hallmark of investment fraud");
  }
  if (ROMANCE.test(p.memo) && p.payee.addedDaysAgo <= 30) {
    add("romance", "Romance pattern", 20, "Emotional memo to a recently added individual");
  }
  if (INVOICE.test(p.memo) && p.payee.addedDaysAgo <= 7) {
    add("bec", "Changed supplier banking details", 25, "Supplier account changed by email is the classic invoice redirection pattern");
  }

  const score = Math.min(100, signals.reduce((s, x) => s + x.weight, 0));
  const band: Verdict["band"] = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const typology = classify(p, signals, score);
  const recommendation: Decision = band === "high" ? "hold" : band === "medium" ? "escalate" : "release";

  return {
    score,
    band,
    typology,
    signals: signals.sort((a, b) => b.weight - a.weight),
    recommendation,
    headline: headline(typology, recommendation, p),
    brief: brief(p, typology, signals, score),
    callScript: callScript(p, typology, recommendation),
    source: "rules",
  };
}

function classify(p: Payment, signals: Signal[], score: number): Typology {
  const has = (k: string) => signals.some((s) => s.key === k);
  if (has("impersonation")) return "Bank / CRA impersonation (safe account)";
  if (has("bec")) return "Invoice redirection (BEC)";
  if (has("investment")) return "Investment / crypto scam";
  if (has("romance")) return "Romance scam";
  if (has("structuring") && (has("new-device") || has("new-payee"))) return "Mule structuring under limit";
  if (has("new-device") && has("velocity")) return "Account takeover";
  if (score >= 40 && has("structuring")) return "Mule structuring under limit";
  return "Benign";
}

function headline(t: Typology, d: Decision, p: Payment): string {
  const amt = `$${p.amount.toLocaleString("en-CA")}`;
  if (d === "hold") return `Hold ${amt} ${p.channel}: pattern matches ${t}.`;
  if (d === "escalate") return `Escalate ${amt} ${p.channel}: mixed signals, second analyst review before settlement.`;
  return `Release ${amt} ${p.channel}: established payee, normal behaviour for this client.`;
}

function brief(p: Payment, t: Typology, signals: Signal[], score: number): string {
  if (signals.length === 0) {
    return `${p.sender.name} (${p.sender.tenureYears}y client) is paying ${p.payee.name}, a payee on file for ${Math.round(p.payee.addedDaysAgo / 30)} months, from a trusted device during normal hours. Nothing in the memo, amount or cadence departs from this client's baseline. Clear to settle.`;
  }
  const top = signals.slice(0, 3).map((s) => s.label).join(", ");
  const irrevocable = p.channel === "RTR" ? "Once this settles on the Real-Time Rail it cannot be recalled." : p.channel === "e-Transfer" ? "Auto-deposit means this e-Transfer is gone the moment it is accepted." : "Wire recall after release depends on the beneficiary bank cooperating.";
  return `Risk ${score}/100. ${p.sender.name} is sending $${p.amount.toLocaleString("en-CA")} to ${p.payee.name}. Strongest signals: ${top}. The combination is consistent with ${t === "Benign" ? "an unusual but explainable payment" : t}. ${irrevocable} A two-minute call with the client before release costs far less than a dispute after settlement.`;
}

function callScript(p: Payment, t: Typology, d: Decision): string[] {
  const first = p.sender.name.split(" ")[0];
  if (d === "release") return [];
  const opener = `Hi ${first}, this is the ${p.bank} payments team. We paused a $${p.amount.toLocaleString("en-CA")} ${p.channel} to ${p.payee.name} for a quick check. Nothing is wrong with your account.`;
  switch (t) {
    case "Bank / CRA impersonation (safe account)":
      return [opener, "Did someone contact you today claiming to be from the bank, the CRA or the police, and ask you to move money to keep it safe?", "Neither the bank nor the CRA will ever ask you to move money to a safe account. That request is always a scam.", "We recommend we cancel this transfer. Would you like us to report the number that called you?"];
    case "Investment / crypto scam":
      return [opener, "How did you first hear about this investment, and have you been able to withdraw any money from it?", "Guaranteed weekly returns are not something any legitimate advisor can promise. Can we hold this for 24 hours while you check the firm on the CSA registry?"];
    case "Romance scam":
      return [opener, "Have you met this person in person? Is this the first time they have asked for money?", "We see this pattern a lot and we are worried about you, not judging you. Can we pause this until tomorrow?"];
    case "Invoice redirection (BEC)":
      return [opener, "The supplier's banking details changed by email. Can you confirm the new account by phoning the supplier at a number you already have on file, not the one in the email?", "We will hold the wire until you confirm. This is the single most common way businesses lose five figures."];
    case "Mule structuring under limit":
      return [opener, "We noticed several transfers just under your daily limit to a new contact. Can you tell us what they are for?", "If someone asked you to move money on their behalf, that can make you liable. Let us walk through it together."];
    case "Account takeover":
      return [opener, "We see a new device on your profile as of today. Was that you?", "If not, we will lock the device, reset your credentials and reverse anything that has not settled."];
    default:
      return [opener, "Can you confirm the purpose of this payment and that you know the recipient personally?"];
  }
}
