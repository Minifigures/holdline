import Anthropic from "@anthropic-ai/sdk";
import type { Payment, Verdict } from "./types";

export interface Brief {
  headline: string;
  brief: string;
  callScript: string[];
  source: Verdict["source"];
}

const SYSTEM =
  "You are HoldLine, a fraud-operations copilot inside a Canadian bank. You never decide; a human analyst does. Given a pending outbound payment and the deterministic risk signals already computed, write the analyst brief. Respond with ONLY compact JSON: {\"headline\": string (max 120 chars, starts with Hold, Release or Escalate), \"brief\": string (3-4 sentences, plain English, name the scam typology, mention that Real-Time Rail / e-Transfer settlement is irrevocable when relevant), \"callScript\": string[] (0-4 short lines the analyst says to the client; empty array if releasing)}. No markdown.";

function userPrompt(p: Payment, v: Verdict): string {
  return JSON.stringify({
    payment: p,
    rulesVerdict: { score: v.score, band: v.band, typology: v.typology, recommendation: v.recommendation, signals: v.signals },
  });
}

function parse(text: string, source: Verdict["source"]): Brief | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const j = JSON.parse(text.slice(start, end + 1)) as Partial<Brief>;
    if (typeof j.headline !== "string" || typeof j.brief !== "string") return null;
    const callScript = Array.isArray(j.callScript) ? j.callScript.filter((x): x is string => typeof x === "string") : [];
    return { headline: j.headline, brief: j.brief, callScript, source };
  } catch {
    return null;
  }
}

async function viaAnthropic(p: Payment, v: Verdict): Promise<Brief | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const client = new Anthropic({ apiKey: key });
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(p, v) }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  return parse(text, "anthropic");
}

async function viaGroq(p: Payment, v: Verdict): Promise<Brief | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(p, v) },
      ],
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parse(j.choices?.[0]?.message?.content ?? "", "groq");
}

async function viaGemini(p: Payment, v: Verdict): Promise<Brief | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userPrompt(p, v) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) return null;
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return parse(j.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "", "gemini");
}

export async function generateBrief(p: Payment, v: Verdict): Promise<Brief> {
  const providers = [viaAnthropic, viaGroq, viaGemini];
  for (const provider of providers) {
    try {
      const out = await provider(p, v);
      if (out) return out;
    } catch {
      // fall through to the next provider
    }
  }
  return { headline: v.headline, brief: v.brief, callScript: v.callScript, source: "rules" };
}

export function activeProvider(): Verdict["source"] {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "rules";
}
