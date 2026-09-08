# Admin API — Cursor Docs

> 快照：https://cursor.com/docs/account/teams/admin-api（2026-09-07 抓取；提供 .md 版本；页面无 Last updated 时间戳）

## Overview

The Admin API is only available for Teams and Enterprise plans. It exposes team-level usage and spend information; it does not report the quota values included with each plan.

Authentication uses Basic Authentication with your team API key.

## Endpoints

- `GET /teams/members` — list team members and seats.
- `GET /teams/audit-logs` — audit logs. Rate limited to 20 requests per minute per team.
- `POST /teams/daily-usage-data` — usage aggregated at the hourly level (composerRequests, chatRequests, agentRequests, subscriptionIncludedReqs, usageBasedReqs, bugbotUsages, mostUsedModel). Rate limited to 20 requests per minute per team.
- `POST /teams/spend` — on-demand spend (`spendCents`), overall spend including included usage (`overallSpendCents`), and per-team spend limits (`monthlyLimitDollars`, `hardLimitOverrideDollars`).
- `POST /teams/filtered-usage-events` — event-level usage; billable requests are the sum of `requestsCosts`.

## Individual plans

Individual plans do not have Admin API access. Individual usage is visible only in the Dashboard (Spending page) after logging in.

An Organizations API is available for customers managing multiple teams.
