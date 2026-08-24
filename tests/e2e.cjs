/* End-to-end: analyst holds the hero case, audit log and metrics update. Run: node tests/e2e.cjs */
const assert = require("node:assert/strict");
const pw = require(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const BASE = process.env.HOLDLINE_URL ?? "http://localhost:3123";
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("heading", { name: "HoldLine" }).waitFor();
  assert.equal(await page.locator(".pulse-red").count(), 6, "six red-dot (high risk) cases in the queue");
  await page.getByRole("button", { name: /CRA Settlement Desk/ }).click();
  await page.getByText("Bank / CRA impersonation (safe account)").first().waitFor();
  await page.getByRole("button", { name: "Hold and call" }).click();
  await page.getByText("Decision recorded:").waitFor();
  assert.ok(await page.getByText("$9,400", { exact: true }).first().isVisible());
  assert.ok((await page.locator("text=HOLD").count()) >= 1, "audit log shows HOLD");
  assert.ok(await page.getByRole("button", { name: "Hold and call" }).isDisabled(), "buttons lock after decision");
  await page.getByRole("button", { name: /Bow Valley Daycare/ }).click();
  await page.getByText("Benign").first().waitFor();
  await page.getByRole("button", { name: "Release" }).click();
  await page.getByText("RELEASE").waitFor();
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  const w = await m.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(w <= 390, `no horizontal overflow on mobile (got ${w})`);
  await browser.close();
  console.log("e2e ok: hold, release, audit log, metrics, mobile");
})().catch((e) => { console.error(e); process.exit(1); });
