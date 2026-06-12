---
description: Show a token/cost and progress report aggregated from .planning/log.md.
---

# /crew:report

Summarize effort and progress from the log.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. Read `.planning/log.md`.
2. Aggregate from `log.md`: count completed phases and sum the `~<n>k tok` and `$<x>` entries → total tokens and total cost.
3. Show a compact report:
   - phases completed (and which milestones)
   - total tokens (and per-phase average)
   - total cost (USD)
   - recent phases with their individual token/cost
4. If `config.observability.trackCost` is false or the log has no cost entries, say so and report just the phase progress.

Read-only — never modifies the log.
