---
description: Show the current project status from .planning/ (roadmap + log).
---

# /crew:status

Read and summarize the current project state. Do not modify anything.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. If `.planning/` does not exist, tell the user to run `/crew:init` and stop.
2. Read `.planning/ROADMAP.md` and report, per milestone: phases done (`[x]`), active (`[>]`), pending (`[ ]`), deferred (`[~]`), including any `@worktree` claim markers.
3. Read the last 5 lines of `.planning/LOG.md` and show recent progress (incl. token/cost notes if present).
4. Read `.planning/claims.json`; if any phase is claimed, list which instance/worktree holds it.
5. Output a compact summary: active milestone, current phase, next pending phase, open claims.

Keep it read-only and concise.
