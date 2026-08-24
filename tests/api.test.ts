import assert from "node:assert/strict";
import { test } from "node:test";
import { payments } from "../src/lib/payments";
import { scorePayment } from "../src/lib/rules";

const BASE = process.env.HOLDLINE_URL ?? "http://localhost:3123";

test("GET /api/triage reports the active brief provider", async () => {
  const r = await fetch(`${BASE}/api/triage`);
  assert.equal(r.status, 200);
  const j = (await r.json()) as { provider: string };
  assert.ok(["rules", "anthropic", "groq", "gemini"].includes(j.provider));
});

test("POST /api/triage returns a full verdict for every seed payment, matching the engine score", async () => {
  for (const p of payments) {
    const r = await fetch(`${BASE}/api/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    assert.equal(r.status, 200, p.id);
    const v = (await r.json()) as ReturnType<typeof scorePayment>;
    const local = scorePayment(p);
    assert.equal(v.score, local.score, p.id);
    assert.equal(v.band, local.band, p.id);
    assert.equal(v.typology, local.typology, p.id);
    assert.ok(typeof v.headline === "string" && v.headline.length > 0);
    assert.ok(typeof v.brief === "string" && v.brief.length > 0);
    assert.ok(Array.isArray(v.callScript));
    assert.ok(["rules", "anthropic", "groq", "gemini"].includes(v.source));
  }
});

test("POST /api/triage rejects unknown ids and malformed bodies", async () => {
  const a = await fetch(`${BASE}/api/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "nope" }) });
  assert.equal(a.status, 404);
  const b = await fetch(`${BASE}/api/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
  assert.equal(b.status, 400);
});
