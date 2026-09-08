# Models & Pricing — Cursor Docs

> 快照：https://cursor.com/docs/models-and-pricing（2026-09-07 抓取；提供 .md 版本；页面无 Last updated 时间戳）

## Usage pools

Each plan includes two monthly usage pools:

**Cursor Models**: Significantly more included usage for Cursor Grok 4.5 and Composer 2.5. Generous included usage for first-party models.

**Other Models**: Paid plans include at least $20 of third-party model usage each month (more on higher tiers), billed at the model's API agent usage rates. Usage is not 1:1 by token count: each model consumes the pool at its own API rate.

On-demand usage is billed at API rates with no markup. Requests are never downgraded in quality or speed.

## Models

The available models depend on your plan. Hobby users have access to a smaller set, while paid plans unlock all models.

| Model | Context (default / max) | Notes |
| --- | --- | --- |
| Composer 2.5 | 200k / – | Cursor's own agentic model |
| Grok 4.5 | 256k / – | Jointly trained by Cursor and SpaceXAI |
| Grok 4.6 | 256k / – | Included in the Cursor Models pool |
| Claude Fable 5.1 | 300k / 1M | Models that require data retention (Claude Fable 5) are off by default |
| Claude Opus 5 | 300k / 1M | Up to 1M tokens with extended context at the same per-token rates |
| Claude Sonnet 5 | 200k / 1M | Up to 1M tokens with extended context at the same per-token rates |
| GPT-5.6 Sol | 272k / 1M | When input exceeds 272k tokens (long context), input pricing doubles and output pricing is 1.5x |
| Gemini 3.1 Pro | 200k / 1M | Frontier model from Google |

Model pricing example (per million tokens): Claude Fable 5.1 — Launch promotion: $2/M input and $10/M output through August 31, 2026.

Preview models have more restrictive rate limits. GPT-5.1 Codex Mini: 4x rate limits compared to GPT-5.1 Codex.

## Auto modes

Auto Cost pricing is set per million tokens, regardless of which model is used ($1.25 input / $0.25 cache read / $6 output). Balance and Intelligence bill at the routed model's rate; the routed model identity is hidden.

## Cursor Token Rate (Teams and Enterprise)

Teams and Enterprise third-party model requests add the Cursor Token Rate: $0.25 per million tokens. The rate applies to input tokens, output tokens, and cached tokens on eligible third-party model requests. This applies to BYOK as well.
