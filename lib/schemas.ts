import { z } from "zod";

export const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;
export const ALLERGENS = [
  "gluten",
  "milk",
  "egg",
  "tree_nuts",
  "peanuts",
  "sesame",
  "soy",
  "fish",
  "shellfish",
  "mustard",
  "celery",
  "sulphites",
] as const;

const Unit = z.enum(UNITS);
const Allergen = z.enum(ALLERGENS);
const Difficulty = z.enum(["easy", "medium", "hard"]);

const Ingredient = z.object({
  name: z.string(),
  qty: z.number(),
  unit: Unit,
  note: z.string(),
});

/* Tool 1: ingredients -> dish ideas + full recipe */
export const DishResult = z.object({
  ideas: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        total_min: z.number(),
        difficulty: Difficulty,
      }),
    )
    .describe("Exactly 3 dish ideas. The first one is the recipe given below unless the user chose a dish."),
  recipe: z.object({
    name: z.string(),
    description: z.string(),
    servings: z.number(),
    prep_min: z.number(),
    cook_min: z.number(),
    kcal_per_portion: z.number(),
    difficulty: Difficulty,
    ingredients: z.array(Ingredient),
    steps: z.array(z.string()),
    chef_tip: z.string(),
    extra_items: z
      .array(z.string())
      .describe("Basic pantry items the recipe adds that the user did not list (salt, oil, water...)."),
    allergens: z.array(Allergen),
  }),
});
export type DishResult = z.infer<typeof DishResult>;

/* Tool 2: guests -> menu, quantities, production plan */
export const EventResult = z.object({
  title: z.string(),
  summary: z.string(),
  menu: z.array(z.object({ course: z.string(), dishes: z.array(z.string()) })),
  quantities: z.array(
    z.object({
      item: z.string(),
      per_person: z.number(),
      per_person_unit: Unit,
      total: z.number(),
      total_unit: Unit,
      note: z.string(),
    }),
  ),
  plan: z.array(
    z.object({
      when: z.string().describe("Day and HH:MM, e.g. 'Wednesday 10:00' or 'Event day 16:30'"),
      task: z.string(),
      who: z.string(),
    }),
  ),
  food_safety: z.array(z.string()),
  allergens: z.array(Allergen),
});
export type EventResult = z.infer<typeof EventResult>;

/* Tool 3: recipe review */
export const ReviewResult = z.object({
  recipe_name: z.string(),
  category: z.string(),
  servings: z.number(),
  portion_g: z.number(),
  verdict: z.string().describe("One sentence summary of the review."),
  corrections: z.array(
    z.object({
      severity: z.enum(["error", "warning"]),
      original: z.string(),
      fix: z.string(),
      reason: z.string(),
    }),
  ),
  time: z.object({ prep_min: z.number(), cook_min: z.number(), total_min: z.number(), note: z.string() }),
  cost: z.object({
    total_sar: z.number(),
    per_portion_sar: z.number(),
    basis: z.string().describe("Which prices were used: estimated Saudi wholesale prices or the user's prices."),
  }),
  kcal: z.object({ total: z.number(), per_portion: z.number() }),
  allergens_present: z.array(Allergen),
  corrected_ingredients: z.array(Ingredient),
  corrected_steps: z.array(z.string()),
  chef_notes: z.array(z.string()),
});
export type ReviewResult = z.infer<typeof ReviewResult>;
