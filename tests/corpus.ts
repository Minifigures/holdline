import type { Bank, Channel, Payment, Typology } from "../src/lib/types";

export interface Labeled { payment: Payment; label: "benign" | "fraud"; typology: Typology }

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BANKS: Bank[] = ["RBC", "TD", "BMO", "Scotiabank", "CIBC"];
const CITIES = ["Toronto, ON", "Mississauga, ON", "Brampton, ON", "Ottawa, ON", "Montreal, QC", "Laval, QC", "Calgary, AB", "Edmonton, AB", "Vancouver, BC", "Surrey, BC", "Winnipeg, MB", "Halifax, NS", "Regina, SK", "Kitchener, ON", "Hamilton, ON"];
const FIRST = ["Aisha", "Liam", "Priya", "Noah", "Olivia", "Ethan", "Fatima", "Jacob", "Mei", "Lucas", "Sophie", "Omar", "Emma", "Arjun", "Chloe", "Daniel", "Hana", "Marc", "Zoe", "Samuel", "Nadia", "Ryan", "Isabelle", "Kwame"];
const LAST = ["Tremblay", "Singh", "Chen", "Nguyen", "Okafor", "Patel", "Roy", "Gagnon", "Kim", "Martin", "Wong", "Lalonde", "Ahmed", "Wilson", "Sandhu", "Lévesque", "Taylor", "Khan", "Bouchard", "Campbell"];
const BENIGN_MEMOS = ["Rent", "Rent August", "Hydro", "Split dinner", "Daycare fees", "Birthday!", "Car payment", "Tuition", "Thanks", "", "for the tickets", "groceries", "Utilities Q3", "Soccer registration", "Cottage weekend", "Invoice 2231", "Piano lessons", "Wedding gift", "Insurance", "Mom's flowers", "Hockey fees", "Phone bill", "Concert tix", "Loan repayment", "Condo fees"];
const BENIGN_PAYEES = ["Property Mgmt", "Daycare", "Hydro Ottawa", "Enbridge", "Landlord", "Sister", "Brother", "Friend", "Dentist", "Tutor", "Cleaning Co", "Contractor", "Piano Teacher", "Family Trust", "Lawyer Trust", "Accountant", "Hockey Club"];
const IMPERSONATION_MEMOS = ["CRA settlement urgent", "move to safe account today", "Bank security officer said transfer now to protect funds", "Revenue Agency arrears, pay immediately", "fraud dept instructed transfer, urgent", "safe account per investigator", "CRA tax owed, deadline today", "protect your funds, move now"];
const IMPERSONATION_PAYEES = ["CRA Settlement Desk", "Bank Fraud Dept", "Security Team", "Revenue Agency Collections", "Investigator M. Roy", "Safe Holding Account"];
const INVESTMENT_MEMOS = ["Starter deposit, guaranteed 12% weekly", "crypto trading account top-up", "USDT purchase per advisor", "guaranteed 10% daily yield", "trading platform deposit", "bitcoin investment, advisor Mike"];
const INVESTMENT_PAYEES = ["Quantum Yield Capital", "Apex Crypto Desk", "Global FX Traders", "BlueChip Yield Ltd", "Nova Trading Co"];
const ROMANCE_MEMOS = ["For your flight home, love you", "miss you, for the visa fee", "customs fee my dear", "love you, for the hospital", "flight home, miss you so much"];
const BEC_MEMOS = ["Invoice 4471, updated banking details per email", "Invoice 9920 remittance, new account", "Invoice 1188 per email, updated banking details", "remittance invoice 7731 new account details"];
const BEC_PAYEES = ["Apex Pipe Supply (new acct)", "Northern Steel Ltd (new)", "Maple Logistics new acct", "Brightline Electrical (updated)"];
const MULE_MEMOS = ["1/4", "2/4", "1/3", "3/3", "2/3", "1/5"];

const HELD_OUT = {
  benignMemos: ["Loyer", "Épicerie", "Merci!", "Remboursement", "Cadeau de mariage", "Cotisation REER", "Frais de garderie", "Hockey", "Tickets Jays", "Half of the Airbnb", "Vet bill", "Camp fees", "Payback", "Sept rent", "Grandma's gift", "Snow removal", "Tax instalment", "Braces", "Lawn care", "Golf", "Invoice 55891 balance", "Retainer", "Tuition balance"],
  benignPayees: ["Gestion Immobilière", "Garderie Les Petits", "Bell Canada", "Rogers", "Coloc", "Cousin", "Dog Walker", "Orthodontist", "Landscaper", "Golf Club", "Notaire", "Comptable", "Family Trust", "Lawyer Trust Account", "Tuition Office"],
  impersonationMemos: ["ARC solde dû, transférer au compte sécurisé", "Agent de sécurité bancaire: protéger vos fonds maintenant", "Warrant issued, tax debt must be cleared within the hour", "Interac fraud unit: move balance to holding account", "RCMP investigator instructed transfer, do not tell bank staff", "Service Canada benefits reversal, pay tax arrears today", "Impôts en retard, dernière chance", "Bank agent said funds at risk, safe keeping transfer"],
  impersonationPayees: ["ARC Recouvrement", "Interac Fraud Unit", "RCMP Financial Crimes", "Compte Sécurisé", "Service Canada Desk", "Bank Investigator"],
  investmentMemos: ["Placement crypto rendement garanti 8% par semaine", "ETH wallet funding via conseiller", "Forex profit share, returns 15% monthly", "Token presale, mining pool deposit", "Tether purchase for trading platform", "Investissement bitcoin, profit garanti"],
  investmentPayees: ["CryptoVault Partners", "Zenith FX", "Alpha Token Labs", "Rendement Plus Inc", "Meridian Mining Pool"],
  romanceMemos: ["Je t'aime, pour ton billet d'avion", "mon amour, frais de visa", "Sweetheart, stuck at the airport, customs", "Darling for the surgery, emergency", "my love, deployed soldier needs plane ticket", "Chéri, hôpital urgence médicale"],
  becMemos: ["Facture 8802, coordonnées bancaires mises à jour par courriel", "Wire instructions changed, supplier new bank account", "Paiement fournisseur facture 3310 nouveau compte", "Bank details changed for invoice 7710, per email"],
  becPayees: ["Fournitures Nordiques (nouveau)", "Prairie Steel new account", "Lakeshore HVAC (updated bank)", "Beauce Bois Inc"],
  muleMemos: ["part 1 of 4", "2 of 3", "1/2", "3/4", "2/5", "1 of 3"],
};

export function generateCorpus(seed = 20260824, benignCount = 900, fraudCount = 100, heldOut = false): Labeled[] {
  const V = heldOut
    ? HELD_OUT
    : { benignMemos: BENIGN_MEMOS, benignPayees: BENIGN_PAYEES, impersonationMemos: IMPERSONATION_MEMOS, impersonationPayees: IMPERSONATION_PAYEES, investmentMemos: INVESTMENT_MEMOS, investmentPayees: INVESTMENT_PAYEES, romanceMemos: ROMANCE_MEMOS, becMemos: BEC_MEMOS, becPayees: BEC_PAYEES, muleMemos: MULE_MEMOS };
  const rnd = mulberry32(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const chance = (p: number) => rnd() < p;
  let n = 0;
  const base = (over: Partial<Payment> & { sender: Payment["sender"]; payee: Payment["payee"]; memo: string; amount: number }): Payment => ({
    id: `GEN-${String(++n).padStart(5, "0")}`,
    bank: pick(BANKS),
    channel: pick<Channel>(["e-Transfer", "e-Transfer", "e-Transfer", "RTR", "Wire"]),
    currency: "CAD",
    device: { isNew: false, label: "trusted" },
    velocity24h: int(1, 2),
    hourLocal: int(7, 22),
    splitsUnderLimit: 0,
    status: "pending",
    submittedAt: "2026-08-24T12:00:00-04:00",
    ...over,
  });
  const person = (ageLo = 19, ageHi = 82) => ({ name: `${pick(FIRST)} ${pick(LAST)}`, age: int(ageLo, ageHi), tenureYears: int(1, 30), city: pick(CITIES) });
  const email = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${pick(["gmail.com", "outlook.com", "yahoo.ca", "icloud.com"])}`;

  const out: Labeled[] = [];
  for (let i = 0; i < benignCount; i++) {
    const kind = rnd();
    let p: Payment;
    if (kind < 0.7) {
      const payee = pick(V.benignPayees);
      p = base({ sender: person(), payee: { name: payee, addedDaysAgo: int(60, 2500), email: email(payee) }, memo: pick(V.benignMemos), amount: int(20, 3000) });
    } else if (kind < 0.8) {
      // first-time small payment to a friend
      const payee = `${pick(FIRST)} ${pick(LAST)}`;
      p = base({ sender: person(), payee: { name: payee, addedDaysAgo: int(0, 5), email: email(payee) }, memo: pick(["Thanks for dinner", "concert tix", "split cab", "", "birthday"]), amount: int(10, 400) });
    } else if (kind < 0.88) {
      // large but established (trust, lawyer, tuition, contractor)
      const payee = pick(["Family Trust", "Lawyer Trust Account", "University Tuition", "Contractor", "Car Dealership"]);
      p = base({ channel: pick<Channel>(["Wire", "RTR", "e-Transfer"]), sender: person(30, 75), payee: { name: payee, addedDaysAgo: int(90, 3000), email: email(payee) }, memo: pick(["Quarterly contribution", "Closing funds", "Fall tuition", "Deck deposit", "Down payment"]), amount: int(5000, 60000) });
    } else if (kind < 0.94) {
      // established payee, new phone
      const payee = pick(V.benignPayees);
      p = base({ sender: person(), payee: { name: payee, addedDaysAgo: int(100, 2000), email: email(payee) }, memo: pick(V.benignMemos), amount: int(20, 2500), device: { isNew: true, label: "new phone" } });
    } else {
      // late-night small transfer to friend on file
      const payee = `${pick(FIRST)} ${pick(LAST)}`;
      p = base({ sender: person(19, 35), payee: { name: payee, addedDaysAgo: int(30, 900), email: email(payee) }, memo: pick(["pizza", "uber", "drinks", "late snack"]), amount: int(10, 120), hourLocal: pick([0, 1, 2, 23]), velocity24h: int(2, 4) });
    }
    out.push({ payment: p, label: "benign", typology: "Benign" });
  }

  const mix: [Typology, number][] = [
    ["Bank / CRA impersonation (safe account)", 0.3],
    ["Investment / crypto scam", 0.2],
    ["Romance scam", 0.15],
    ["Invoice redirection (BEC)", 0.15],
    ["Mule structuring under limit", 0.2],
  ];
  for (let i = 0; i < fraudCount; i++) {
    let r = rnd();
    let typology: Typology = mix[0][0];
    for (const [t, w] of mix) { if (r < w) { typology = t; break; } r -= w; }
    let p: Payment;
    switch (typology) {
      case "Bank / CRA impersonation (safe account)": {
        const payee = pick(V.impersonationPayees);
        p = base({ sender: person(58, 88), payee: { name: payee, addedDaysAgo: int(0, 3), email: `${payee.toLowerCase().replace(/[^a-z]+/g, ".")}@${pick(["proton.me", "gmail.com", "outlook.com"])}` }, memo: pick(V.impersonationMemos), amount: int(1500, 15000), device: { isNew: chance(0.4), label: "new" }, velocity24h: int(1, 4) });
        break;
      }
      case "Investment / crypto scam": {
        const payee = pick(V.investmentPayees);
        p = base({ channel: pick<Channel>(["RTR", "e-Transfer", "Wire"]), sender: person(25, 70), payee: { name: payee, addedDaysAgo: int(0, 10), email: email(payee) }, memo: pick(V.investmentMemos), amount: int(1000, 6000), hourLocal: chance(0.4) ? pick([23, 0, 1]) : int(8, 22), splitsUnderLimit: chance(0.5) ? int(3, 4) : 0 });
        break;
      }
      case "Romance scam": {
        const payee = `${pick(FIRST)} ${pick(LAST)}`;
        p = base({ sender: person(52, 80), payee: { name: payee, addedDaysAgo: int(2, 25), email: email(payee) }, memo: pick(V.romanceMemos), amount: int(500, 3000), velocity24h: int(2, 5), hourLocal: chance(0.5) ? pick([1, 2, 3, 23]) : int(8, 22) });
        break;
      }
      case "Invoice redirection (BEC)": {
        const payee = pick(V.becPayees);
        p = base({ channel: "Wire", sender: { name: `${pick(["Northgate", "Maple", "Lakeshore", "Prairie"])} ${pick(["Plumbing", "Roofing", "Dental", "Logistics"])} Ltd.`, age: 0, tenureYears: int(3, 25), city: pick(CITIES) }, payee: { name: payee, addedDaysAgo: int(0, 2), email: `ar@${payee.toLowerCase().replace(/[^a-z]+/g, "-")}.com` }, memo: pick(V.becMemos), amount: int(8000, 60000) });
        break;
      }
      default: {
        const payee = `${pick(FIRST)} ${pick(["B", "K", "M", "T"])}`;
        p = base({ sender: person(19, 40), payee: { name: payee, addedDaysAgo: int(0, 1), email: email(payee) }, memo: pick(V.muleMemos), amount: int(2850, 3000), splitsUnderLimit: int(3, 5), device: { isNew: chance(0.6), label: "new" }, velocity24h: int(4, 8), hourLocal: chance(0.5) ? pick([2, 3, 4]) : int(8, 22) });
      }
    }
    out.push({ payment: p, label: "fraud", typology });
  }
  return out;
}
