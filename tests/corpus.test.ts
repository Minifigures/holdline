import assert from "node:assert/strict";
import { test } from "node:test";
import { scorePayment } from "../src/lib/rules";
import { generateCorpus, type Labeled } from "./corpus";

type Scored = Labeled & { verdict: ReturnType<typeof scorePayment> };
const score = (xs: Labeled[]): Scored[] => xs.map((c) => ({ ...c, verdict: scorePayment(c.payment) }));
const rate = (xs: Scored[], pred: (v: Scored) => boolean) => (xs.length ? xs.filter(pred).length / xs.length : 1);

function metrics(name: string, xs: Scored[]) {
  const f = xs.filter((c) => c.label === "fraud");
  const b = xs.filter((c) => c.label === "benign");
  const m = {
    fraudFlagged: rate(f, (c) => c.verdict.band !== "low"),
    fraudHeld: rate(f, (c) => c.verdict.band === "high"),
    typologyHit: rate(f, (c) => c.verdict.typology === c.typology),
    benignHeld: rate(b, (c) => c.verdict.band === "high"),
    benignFlagged: rate(b, (c) => c.verdict.band !== "low"),
  };
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log(`[${name}] ${xs.length} payments (${f.length} fraud / ${b.length} benign): fraud flagged ${pct(m.fraudFlagged)}, fraud held ${pct(m.fraudHeld)}, typology named ${pct(m.typologyHit)}, benign held ${pct(m.benignHeld)}, benign flagged ${pct(m.benignFlagged)}`);
  for (const t of [...new Set(f.map((c) => c.typology))]) {
    const ys = f.filter((c) => c.typology === t);
    console.log(`    ${t}: n=${ys.length}, flagged ${pct(rate(ys, (c) => c.verdict.band !== "low"))}, held ${pct(rate(ys, (c) => c.verdict.band === "high"))}, named ${pct(rate(ys, (c) => c.verdict.typology === t))}`);
  }
  return m;
}

// Corpus A: the development set the rules were tuned against (seed 20260824, vocabulary A).
const A = score(generateCorpus(20260824, 900, 100, false));
// Corpus B: held-out. Different seed AND a different vocabulary (paraphrased English + French memos and payees)
// that the rules were not written against. Same thresholds apply.
const B = score(generateCorpus(99173, 900, 100, true));
// Corpus C: a second held-out draw with a third seed, to check the B result is not a lucky seed.
const C = score(generateCorpus(4242, 1800, 200, true));

const mA = metrics("dev A", A);
const mB = metrics("held-out B", B);
const mC = metrics("held-out C", C);

test("corpus generation is deterministic for a fixed seed", () => {
  assert.deepEqual(generateCorpus(1, 50, 10), generateCorpus(1, 50, 10));
  assert.equal(A.length, 1000);
  assert.equal(B.length, 1000);
  assert.equal(C.length, 2000);
});

// One test per payment in the development corpus: benign must never be recommended for hold,
// fraud must always be flagged for review (medium or high).
for (const c of A) {
  const p = c.payment;
  const desc = c.label === "benign"
    ? `A ${p.id} benign: $${p.amount} to ${p.payee.name} "${p.memo}" is not held`
    : `A ${p.id} ${c.typology}: $${p.amount} "${p.memo}" is flagged`;
  test(desc, () => {
    if (c.label === "benign") assert.notEqual(c.verdict.band, "high", JSON.stringify(c.verdict.signals));
    else assert.notEqual(c.verdict.band, "low", JSON.stringify(c.verdict.signals));
  });
}

for (const [name, m] of [["dev A", mA], ["held-out B", mB], ["held-out C", mC]] as const) {
  test(`${name}: at least 95% of fraud is flagged for review`, () => assert.ok(m.fraudFlagged >= 0.95, `got ${m.fraudFlagged}`));
  test(`${name}: at least 75% of fraud is recommended for hold`, () => assert.ok(m.fraudHeld >= 0.75, `got ${m.fraudHeld}`));
  test(`${name}: at least 90% of fraud gets the right typology`, () => assert.ok(m.typologyHit >= 0.9, `got ${m.typologyHit}`));
  test(`${name}: no more than 2% of benign payments are recommended for hold`, () => assert.ok(m.benignHeld <= 0.02, `got ${m.benignHeld}`));
  test(`${name}: no more than 10% of benign payments are flagged at all`, () => assert.ok(m.benignFlagged <= 0.1, `got ${m.benignFlagged}`));
}

test("every verdict across all corpora is well-formed", () => {
  for (const c of [...A, ...B, ...C]) {
    assert.ok(c.verdict.score >= 0 && c.verdict.score <= 100);
    assert.ok(["low", "medium", "high"].includes(c.verdict.band));
    assert.ok(c.verdict.headline.length > 10);
    assert.ok(c.verdict.brief.length > 40);
    if (c.verdict.recommendation === "release") assert.equal(c.verdict.callScript.length, 0);
  }
});
