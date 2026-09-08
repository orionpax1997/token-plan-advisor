# TRAE Membership Upgrade — Token-based Billing

> Source: https://www.trae.ai/blog/trae_membership_0213
>
> Published: February 13, 2026

## Summary

We are excited to announce the upgrade to TRAE membership, transitioning from fast/slow request-based billing to a token-based billing model powered by Dollar Usage.

## What's New

- **New plans**: Lite ($3/mo), Pro ($10/mo), Pro+ ($30/mo), Ultra ($100/mo)
- **Basic Usage**: Each plan includes a fixed monthly Dollar Usage quota — Lite $5, Pro $20, Pro+ $90, Ultra $400
- **Bonus Usage**: Additional flexible usage based on actual activity
- **On-Demand Usage**: Continue past Basic Usage at API rates; settle every $3

## Context Window Size

- **Regular Mode**: up to 272K tokens, depending on model choices
- **Max Mode**: up to 1M tokens, depending on model choices

Up to 200 tool calls per session across all modes.

## Migration

Users with legacy fast request balances will be converted at the rate of 6 Fast Requests = $1 Dollar Usage. The migration takes effect on February 24, 2026 (2 AM UTC).

## Pro Trial

We will offer a 14-day free Pro trial to all new users who register after February 13, 2026. The trial includes $5 Basic Usage.

## Existing Users

Existing Pro users receive a $20 transition credit valid for 90 days.

## FAQ

### Why token-based billing?

Token-based billing provides clearer cost alignment with the model you use and gives you more flexibility in how you spend your quota.

### Will my Basic Usage reset every month?

Yes. Basic Usage is renewed at the start of each billing cycle and unused quota does not roll over.

### What happens if I exhaust Basic Usage?

Lite and above plans can enable On-Demand Usage, which continues at API rates and settles every $3 accumulated.
