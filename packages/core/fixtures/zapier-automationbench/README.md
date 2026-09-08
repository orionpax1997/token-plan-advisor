# AutomationBench

A benchmark for evaluating AI agents on realistic business workflows.

## What it measures

AutomationBench evaluates AI agents and models on real business workflows — sales,
marketing, operations, support, finance, and HR. Each task initializes a simulated
company environment (CRM, calendar, inbox, etc.) and verifies that the agent's
final state matches the required end state.

The public task set contains 600 tasks across 6 domains (100 per domain); an
additional 200 `simple` domain tasks cover basic single/two-step tool usage and
are not included in the official score.

## Official leaderboard

The official leaderboard at <https://zapier.com/benchmarks> uses a separate,
held-out private task set per domain. The public task set is intended for local
runs; **public task set scores are not 1:1 equivalent to leaderboard scores**, and
should only be expected to correlate directionally.

## Metrics

- `task_completed_correctly` — strict pass/fail; every assertion must pass.
- `partial_credit` — proportion of assertions passed (0.0–1.0). Diagnostic only;
  not used for the headline leaderboard score.

## Running locally

```bash
uv run auto-bench
```

Requires API keys for the model under test (e.g., `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`).
