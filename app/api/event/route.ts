import { z } from "zod";
import { EventResult } from "@/lib/schemas";
import { ZADK_BASE, langLine, runStructured, rateLimited, clientIp, errorResponse } from "@/lib/claude";

export const maxDuration = 120;

const Input = z.object({
  guests: z.number().int().min(2).max(1000),
  cooks: z.number().int().min(1).max(50),
  occasion: z.string().max(40),
  notes: z.array(z.string().max(40)).max(10),
  extra: z.string().max(600),
  serviceTime: z.string().max(60),
  prepAhead: z.string().max(40),
  lang: z.enum(["ar", "en"]),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "input" }, { status: 400 });
  if (rateLimited(clientIp(req))) return Response.json({ error: "limit" }, { status: 429 });
  const i = parsed.data;

  const system = `${ZADK_BASE}

Task: plan a menu for an event and give quantities and a simple production plan.
- Build a balanced menu for the occasion (usually starters, main course with a starch, dessert; a drink when it fits). 4 to 7 dishes in total.
- quantities: one row per dish (and per main component such as rice or protein when it matters). per_person is the cooked serving; total = per_person × guests plus a safety margin of about 10% (say so in note). Use kg/l for large totals.
- Portion guide: starter/salad 80–120 g, soup 250–300 ml, main 350–450 g plate (protein 150–200 g cooked), rice 200–250 g, side 100–150 g, dessert 80–150 g, beverage 200–250 ml.
- plan: a timed production plan split into the advance prep day (if allowed) and the event day, scheduled backwards from service time.
  Long items (marinating, braising, doughs, desserts that must set, sauces) go to the advance day. Anything fried, grilled or assembled happens only 15–20 minutes before it is served.
  Start the event day with a 10-minute team briefing and end with close-down. Assign "who" as Cook 1, Cook 2... or All, and never give one cook two active tasks at the same time. 10 to 16 rows.
- food_safety: 3 to 5 short rules that matter most for this menu.
${langLine(i.lang)}`;

  const user = `Guests: ${i.guests}\nCooks: ${i.cooks}\nOccasion: ${i.occasion}\nService time: ${i.serviceTime}\nAdvance prep: ${i.prepAhead}\nRequirements: ${i.notes.join(", ") || "none"}\nOther notes: ${i.extra || "none"}`;

  try {
    const result = await runStructured({ schema: EventResult, system, content: [{ type: "text", text: user }], effort: "low", maxTokens: 8000 });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
