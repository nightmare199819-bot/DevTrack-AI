# DevTrack AI learning coach connection

This folder contains the small private-key proxy used by the AI Roadmap page. It keeps the Gemini API key in a Cloudflare Worker secret. The key is never placed in `index.html`, the public GitHub repository, or browser storage.

## Free setup

The connection uses Gemini's free API tier and the Cloudflare Workers Free plan. Free quotas have limits and can change. The Gemini free tier currently says submitted content may be used to improve Google's products, so enter learning goals and preferences only; the page does not send your timetable, task history, LeetCode profile, or local notes. Do not link a billing account to the Google AI Studio project if you want to keep this connection on the no-cost tier.

Official details: [Gemini API free tier and data terms](https://ai.google.dev/gemini-api/docs/pricing), [Gemini billing tiers](https://ai.google.dev/gemini-api/docs/billing), [Cloudflare Workers Free plan](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Deploy from this GitHub repository

1. In Google AI Studio, create a Gemini API key in a project that has no billing account linked. Keep the key private.
2. Create a free Cloudflare account and install Node.js if needed.
3. Open a terminal in this `worker` folder and run:
   ```sh
   npx wrangler login
   npx wrangler deploy
   ```
4. Add the API key as an encrypted Worker secret. Wrangler prompts for the value without saving it in this repository:
   ```sh
   npx wrangler secret put GEMINI_API_KEY
   ```
5. Copy the Worker URL that Cloudflare shows, usually `https://devtrack-ai-learning-coach.<your-subdomain>.workers.dev`.
6. Open DevTrack AI → Settings & data. Paste the Worker URL into **Secure AI Worker URL** and save.
7. Open **AI roadmap**, enter a goal, level, weekly hours, and preferred teaching language, then create a roadmap.

The Worker serves only `POST /roadmap` for the DevTrack Pages origin. It applies a small per-IP request limit, accepts only short learning-goal inputs, and maps the model's resource choices to a built-in list of direct lesson and playlist links. The rate limit is best-effort because free Workers run in multiple isolates. The Gemini key remains only in the Worker secret store.

## Included direct learning links

The curated catalogue includes MDN, freeCodeCamp, React, Node.js, Python, CS50, SQLBolt, Google ML Crash Course, Kaggle, PyTorch, LeetCode's Top Interview 150 plan, and a direct CodeWithHarry JavaScript playlist. The model selects catalogue IDs; it cannot make up or substitute a homepage URL.

The Worker is not live until it is deployed to your Cloudflare account and its URL is saved in DevTrack settings. Requests stop when the provider's free quota is reached; this setup does not upgrade to a paid tier.
