# ZADK & AI

Showcase site for ZADK (Saudi Culinary Arts Academy) on how the academy uses AI in the kitchen, with three working tools:

1. **From ingredient to dish** – ingredients on hand → 3 dish ideas + a full printable recipe.
2. **Event planner** – guest count → menu, quantities per item, and a simple timed production plan.
3. **Recipe reviewer** – paste a recipe (or upload a photo) → corrections, time, allergens, cost (SAR) and calories. Rules follow the ZADK Chef Reviewer.

Arabic (RTL) by default with an English toggle. Built with Next.js and the Claude API (`claude-sonnet-5-5` by default).

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

Each tool call uses the Anthropic API and is billed to that key. Cost controls: each request has a hard output cap (6,000–8,000 tokens), inputs and images are size-limited, and each visitor gets about 10 tries a day (best effort). Set `CLAUDE_MODEL` in Vercel to change the model (default `claude-sonnet-5-5`; `claude-opus-5-5` gives the best quality at about twice the cost, `claude-haiku-5-5` is far cheaper). Put a monthly spend limit on the API key's workspace as the final cap.
