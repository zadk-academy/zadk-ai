import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { ReviewResult } from "@/lib/schemas";
import { ZADK_BASE, langLine, runStructured, rateLimited, clientIp, errorResponse } from "@/lib/claude";

export const maxDuration = 120;

const Input = z.object({
  recipe: z.string().max(6000),
  prices: z.string().max(2000),
  image: z
    .object({
      mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
      data: z.string().max(2_800_000), // ~2 MB image
    })
    .nullable(),
  lang: z.enum(["ar", "en"]),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "input" }, { status: 400 });
  const i = parsed.data;
  if (i.recipe.trim().length < 10 && !i.image) return Response.json({ error: "input" }, { status: 400 });
  if (rateLimited(clientIp(req))) return Response.json({ error: "limit" }, { status: 429 });

  const system = `${ZADK_BASE}

Task: review a recipe the way the ZADK Chef Reviewer does. The recipe can be in any language or format, including a photo.
1. Read the whole recipe. Identify its category (appetizer, soup, salad, main course, rice dish, side, bread, dessert, beverage, sauce).
2. Find what is illogical, missing or unsafe: impossible quantities (for example cups of salt), ratios (rice to water, flour to liquid, salt %, leavening),
   wrong or mixed units, ingredients used in the method but not listed (or listed and never used), wrong step order, missing times or temperatures, food-safety gaps.
   Each problem is one correction: "error" for something that would ruin the dish or is unsafe, "warning" for a judgment call or missing detail.
   original = what the recipe says, fix = what it should be, reason = one short sentence.
3. Liquids: for dishes cooked with water or stock, check the liquid against absorption (basmati soaked 1.5–1.8 × rice weight, sella 2.0–2.4) plus evaporation over the cooking time, minus liquid released by meat (20–30% of raw weight). Correct it if it is off by more than 10%.
4. Keep the recipe's own number of servings. If none is given, estimate it from the yield and the standard portion:
   appetizer 100–120 g, soup 250–300 ml, salad 80–120 g, main course 350–450 g, rice dish 400–500 g, side 100–150 g, bread 60–120 g, dessert 80–150 g, beverage 200–250 ml.
5. time: realistic prep and cook minutes for the batch; total includes resting or cooling only if it is part of the recipe (say so in note).
6. cost: price every ingredient. If the user gives prices, use them; otherwise use realistic current Saudi wholesale prices in SAR and say "estimated" in basis.
7. kcal: approximate calories from standard nutrition values (raw weights); deep-fry oil counts only for absorbed oil.
8. allergens_present: check gluten, milk, egg, tree nuts, peanuts, sesame, soy, fish, shellfish, mustard, celery, sulphites.
9. corrected_ingredients and corrected_steps: the full recipe after your corrections, in metric units.
10. chef_notes: 1 to 3 key teaching points (the most common student mistake or the key to success).
Never approve the recipe; it is a reviewed draft for the chef to test.
${langLine(i.lang)}`;

  const content: Anthropic.ContentBlockParam[] = [];
  if (i.image) content.push({ type: "image", source: { type: "base64", media_type: i.image.mediaType, data: i.image.data } });
  content.push({
    type: "text",
    text: `Recipe:\n${i.recipe || "(see the image)"}\n\nIngredient prices from the user: ${i.prices.trim() || "none, use estimated prices"}`,
  });

  try {
    const result = await runStructured({ schema: ReviewResult, system, content, effort: "medium", maxTokens: 8000 });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
