---
description: Show a token/cost and progress report aggregated from .planning/log.md.
---

# /crew:report

Summarize effort and progress from the log.

## Steps

1. Read `.planning/log.md`.
2. Aggregate (use `aggregateLog` from `src/report/aggregate.ts`): number of completed phases, total tokens, total cost.
3. Show a compact report:
   - phases completed (and which milestones)
   - total tokens (and per-phase average)
   - total cost (USD)
   - recent phases with their individual token/cost
4. If `config.observability.trackCost` is false or the log has no cost entries, say so and report just the phase progress.

Read-only — never modifies the log.
