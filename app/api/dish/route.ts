import { z } from "zod";
import { DishResult } from "@/lib/schemas";
import { ZADK_BASE, langLine, runStructured, rateLimited, clientIp, errorResponse } from "@/lib/claude";

export const maxDuration = 120;

const Input = z.object({
  ingredients: z.string().trim().min(3).max(2000),
  pax: z.number().int().min(1).max(50),
  time: z.string().max(60),
  cuisine: z.string().max(40),
  choice: z.string().max(120).optional(),
  lang: z.enum(["ar", "en"]),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "input" }, { status: 400 });
  if (rateLimited(clientIp(req))) return Response.json({ error: "limit" }, { status: 429 });
  const i = parsed.data;

  const system = `${ZADK_BASE}

Task: the user lists the ingredients they have. Suggest exactly 3 different dishes they can cook mainly from those ingredients,
then write the full recipe for one of them for ${i.pax} people.
- Use the listed ingredients as the base. You may add basic pantry items (salt, pepper, oil, water, common spices) and list them in extra_items.
- Respect quantities the user gives; do not use more of an ingredient than they have.
- Fit the available time and the cuisine preference.
- Portion guide: main course 350–450 g per plate (cooked protein 150–200 g), rice dish 400–500 g.
- 4 to 8 clear steps. kcal_per_portion is an approximate estimate.
- chef_tip: one practical point a culinary student should remember for this dish.
${langLine(i.lang)}`;

  const user = `Ingredients I have:\n${i.ingredients}\n\nPeople: ${i.pax}\nAvailable time: ${i.time}\nCuisine preference: ${i.cuisine}` +
    (i.choice ? `\n\nI choose this dish, write its recipe (keep it as the first idea): ${i.choice}` : "");

  try {
    const result = await runStructured({ schema: DishResult, system, content: [{ type: "text", text: user }], effort: "low" });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
