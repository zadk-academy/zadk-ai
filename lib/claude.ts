import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const MODEL = "claude-opus-5-5";

export const ZADK_BASE = `You are a senior executive chef and culinary instructor at ZADK, the Saudi Culinary Arts Academy.
You help students and chefs think, plan and review. Your answers are a starting point; the chef makes the final call.
Write for a professional kitchen in Saudi Arabia: halal ingredients only, no pork and no alcohol.
Use metric units only: g, kg, ml, l, or pcs for items used whole (eggs, lemons, bay leaves). Never use cups or spoons.
Steps start with an imperative verb, include heat level or temperature in °C and a doneness cue.
Food safety: poultry core ≥ 74°C, minced meat ≥ 71°C, hot holding ≥ 63°C, reheat once to ≥ 75°C.`;

export function langLine(lang: "ar" | "en") {
  return lang === "ar"
    ? "Write every text field in clear Modern Standard Arabic suitable for Saudi readers. Keep numbers as numbers."
    : "Write every text field in clear, simple English.";
}

export class RefusalError extends Error {}
export class ConfigError extends Error {}

export async function runStructured<T extends z.ZodType>(opts: {
  schema: T;
  system: string;
  content: Anthropic.ContentBlockParam[];
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<T>> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ConfigError("ANTHROPIC_API_KEY is not set");
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 12000,
    system: opts.system,
    output_config: { effort: opts.effort ?? "medium", format: zodOutputFormat(opts.schema) },
    messages: [{ role: "user", content: opts.content }],
  });

  if (response.stop_reason === "refusal") throw new RefusalError("refused");
  if (response.stop_reason === "max_tokens") throw new Error("Response was cut off");
  if (!response.parsed_output) throw new Error("Could not read the model response");
  return response.parsed_output as z.infer<T>;
}

/* Best-effort per-IP limit so a public demo can't be used to run up the API bill.
   Serverless instances don't share memory, so this is a soft guard, not a hard quota. */
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, max = 12, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function errorResponse(err: unknown) {
  if (err instanceof ConfigError) return Response.json({ error: "config" }, { status: 500 });
  if (err instanceof RefusalError)
    return Response.json({ error: "refused" }, { status: 422 });
  if (err instanceof Anthropic.RateLimitError)
    return Response.json({ error: "busy" }, { status: 429 });
  if (err instanceof Anthropic.AuthenticationError)
    return Response.json({ error: "config" }, { status: 500 });
  if (err instanceof Anthropic.APIError) {
    // Short, key-free detail so failures can be diagnosed from the browser.
    console.error("Anthropic API error", err.status, err.message);
    return Response.json({ error: "upstream", detail: `${err.status ?? ""} ${err.message}`.slice(0, 300) }, { status: 502 });
  }
  console.error(err);
  return Response.json({ error: "unknown", detail: String(err).slice(0, 300) }, { status: 500 });
}
