# ZADK & AI

Showcase site for ZADK (Saudi Culinary Arts Academy) on how the academy uses AI in the kitchen, with three working tools:

1. **From ingredient to dish** – ingredients on hand → 3 dish ideas + a full printable recipe.
2. **Event planner** – guest count → menu, quantities per item, and a simple timed production plan.
3. **Recipe reviewer** – paste a recipe (or upload a photo) → corrections, time, allergens, cost (SAR) and calories. Rules follow the ZADK Chef Reviewer.

Arabic (RTL) by default with an English toggle. Built with Next.js and the Claude API (`claude-opus-5-5`).

## Run locally

```bash
npm install
cp .env.example .env.local   # then put your Anthropic API key in it
npm run dev
```

## Deploy on Vercel

1. Import this repository in Vercel and name the project `zadk-ai` (gives `zadk-ai.vercel.app`).
2. In Project Settings → Environment Variables add `ANTHROPIC_API_KEY`.
3. Deploy.

Each tool call uses the Anthropic API and is billed to that key. The API routes cap inputs and allow about 12 tries per visitor per hour (best effort).
