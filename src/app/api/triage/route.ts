import { NextResponse } from "next/server";
import { activeProvider, generateBrief } from "@/lib/llm";
import { payments } from "@/lib/payments";
import { scorePayment } from "@/lib/rules";
import type { Verdict } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ provider: activeProvider() });
}

export async function POST(req: Request) {
  let id = "";
  try {
    const body = (await req.json()) as { id?: string };
    id = body.id ?? "";
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const payment = payments.find((p) => p.id === id);
  if (!payment) return NextResponse.json({ error: "unknown payment" }, { status: 404 });

  const rules = scorePayment(payment);
  const brief = await generateBrief(payment, rules);
  const verdict: Verdict = { ...rules, ...brief };
  return NextResponse.json(verdict);
}
