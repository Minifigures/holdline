import assert from "node:assert/strict";
import { test } from "node:test";
import { payments } from "../src/lib/payments";
import { scorePayment } from "../src/lib/rules";
import type { Verdict } from "../src/lib/types";

const expected: Record<string, { band: Verdict["band"]; typology: Verdict["typology"]; recommendation: Verdict["recommendation"] }> = {
  "PMT-24081": { band: "high", typology: "Bank / CRA impersonation (safe account)", recommendation: "hold" },
  "PMT-24082": { band: "high", typology: "Investment / crypto scam", recommendation: "hold" },
  "PMT-24083": { band: "low", typology: "Benign", recommendation: "release" },
  "PMT-24084": { band: "high", typology: "Invoice redirection (BEC)", recommendation: "hold" },
  "PMT-24085": { band: "low", typology: "Benign", recommendation: "release" },
  "PMT-24086": { band: "high", typology: "Romance scam", recommendation: "hold" },
  "PMT-24087": { band: "low", typology: "Benign", recommendation: "release" },
  "PMT-24088": { band: "high", typology: "Mule structuring under limit", recommendation: "hold" },
  "PMT-24089": { band: "low", typology: "Benign", recommendation: "release" },
  "PMT-24090": { band: "high", typology: "Bank / CRA impersonation (safe account)", recommendation: "hold" },
};

for (const p of payments) {
  test(`seed ${p.id}: ${expected[p.id].typology}`, () => {
    const v = scorePayment(p);
    assert.equal(v.band, expected[p.id].band);
    assert.equal(v.typology, expected[p.id].typology);
    assert.equal(v.recommendation, expected[p.id].recommendation);
  });
}

test("score is bounded 0-100 and equals the sum of signal weights (capped)", () => {
  for (const p of payments) {
    const v = scorePayment(p);
    const sum = v.signals.reduce((a, s) => a + s.weight, 0);
    assert.equal(v.score, Math.min(100, sum));
    assert.ok(v.score >= 0 && v.score <= 100);
  }
});

test("signals are sorted by weight, descending", () => {
  for (const p of payments) {
    const w = scorePayment(p).signals.map((s) => s.weight);
    assert.deepEqual(w, [...w].sort((a, b) => b - a));
  }
});

test("release verdicts carry no call script; holds always do", () => {
  for (const p of payments) {
    const v = scorePayment(p);
    if (v.recommendation === "release") assert.equal(v.callScript.length, 0);
    if (v.recommendation === "hold") assert.ok(v.callScript.length >= 2);
  }
});

test("scoring is deterministic and pure", () => {
  for (const p of payments) {
    const a = scorePayment(p);
    const b = scorePayment(structuredClone(p));
    assert.deepEqual(a, b);
  }
});

test("a large payment to a long-standing payee is not held (no over-blocking)", () => {
  const base = payments.find((p) => p.id === "PMT-24089")!;
  const v = scorePayment({ ...base, amount: 60000 });
  assert.equal(v.band, "low");
  assert.equal(v.recommendation, "release");
});

test("the safe-account phrase alone drives a hold even from a trusted device", () => {
  const base = payments.find((p) => p.id === "PMT-24087")!;
  const v = scorePayment({
    ...base,
    payee: { name: "Bank Security", addedDaysAgo: 0, email: "sec@mail.com" },
    memo: "move to safe account as instructed by bank security officer",
  });
  assert.equal(v.typology, "Bank / CRA impersonation (safe account)");
  assert.equal(v.band, "high");
});
