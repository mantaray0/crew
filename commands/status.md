---
description: Show the current project status from .planning/ (roadmap + log).
---

# /crew:status

Read and summarize the current project state. Do not modify anything.

`status` is the read-only **dashboard** — "where do we stand?", callable any time, with no memory of what you were mid-doing. To **re-enter work** in a fresh session — with the `LOG.md` history's DO-NOT-RETRY and the exact next step — use `/crew:resume` instead.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. If `.planning/` does not exist, tell the user to run `/crew:init` and stop.
2. Read `.planning/ROADMAP.md` and report, per milestone: phases done (`[x]`), active (`[>]`), pending (`[ ]`), deferred (`[~]`), including any `@worktree` claim markers.
3. Read the last 5 lines of `.planning/LOG.md` and show recent progress (incl. token/cost notes if present).
4. Read `.planning/claims.json`; if any phase is claimed, list which instance/worktree holds it.
5. Read `.planning/BACKLOG.md` and show a compact backlog section: item count plus the first ~5 titles. On overflow, append `… (+k more — run /crew:backlog list)`. If empty or placeholder-only, note it. Read-only — never write to it.
6. **Config inheritance (resolved value + source).** Show a compact section — read-only counterpart to `/crew:update`'s reconcile report. Read the three layers — `.planning/config.json` (project), `~/.claude/crew/config.json` (global), and the built-in defaults — and **resolve per the canonical rule** in `crew-config` → *Resolving inherited fields*. **Reference those rules — do not restate them.** Render the inheritable leaves reusing the **exact** form from `crew-config` → *Surfacing the source* — an inheriting field carries the `inherit → value (from source)` arrow, a frozen field shows just its value (no arrow):

   > `` `language.files`: inherit → `de` (from global) `` · `` `responseStyle`: inherit → `concise` (from default) `` · `` `git.isolation`: `worktree-per-milestone` (frozen) ``

   Reuse that form verbatim — don't invent a tabular variant. Keep it to the inheritable leaves plus a one-line project-facts header (`projectType`/`tags`/`stack`/`crewVersion`) — **no** full-schema dump; end with a pointer "full reconcile report via `/crew:update`". This step is **display-only** — never write config or offer edits (that is `/crew:init`/`/crew:setup`/`/crew:update`).
7. Output a compact summary: active milestone, current phase, next pending phase, open claims, backlog count.

Keep it read-only and concise.
